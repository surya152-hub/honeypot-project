const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
require("dotenv").config();

const speakeasy = require("speakeasy");
const QRCode = require("qrcode");

const app = express();
const PORT = 3000;

/* ================= MIDDLEWARE (ONLY ONCE) ================= */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: "mysecretkey",
  resave: false,
  saveUninitialized: true
}));

app.use(express.static("public"));

/* ================= CONFIG ================= */
const ADMIN_USER = "admin";
const ADMIN_PASS = "admin123";

let failedAttempts = {};
const MAX_ATTEMPTS = 5;
const BLOCK_TIME = 2 * 60 * 1000;

let secret = null;

/* ================= LOGGING ================= */
app.use((req, res, next) => {
  if (req.originalUrl === "/dashboard") return next();

  const log = {
    time: new Date().toISOString(),
    ip: req.ip,
    method: req.method,
    url: req.originalUrl,
    body: req.body
  };

  fs.appendFileSync("attacks.log", JSON.stringify(log) + "\n");
  next();
});

/* ================= LOGIN PAGE ================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ================= LOGIN HANDLER ================= */
app.post("/login", (req, res) => {
  const ip = req.ip;
  const { username, password } = req.body;

  if (failedAttempts[ip] && failedAttempts[ip].blockedUntil > Date.now()) {
    return res.send("🚫 Too many attempts. Try later.");
  }

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    failedAttempts[ip] = { count: 0 };
    req.session.loggedIn = true;
    return res.redirect("/setup-2fa");
  }

  if (!failedAttempts[ip]) {
    failedAttempts[ip] = { count: 0 };
  }

  failedAttempts[ip].count++;

  if (failedAttempts[ip].count >= MAX_ATTEMPTS) {
    failedAttempts[ip].blockedUntil = Date.now() + BLOCK_TIME;
    return res.send("⛔ IP Blocked for 2 minutes.");
  }

  res.send("❌ Invalid credentials");
});

/* ================= 2FA SETUP ================= */
app.get("/setup-2fa", async (req, res) => {
  secret = speakeasy.generateSecret({
    length: 20,
    name: "HoneypotApp"
  });

  const qr = await QRCode.toDataURL(secret.otpauth_url);

  
res.send(`
<html>
<head>
  <link rel="stylesheet" href="/style.css">
</head>
<body>

<div class="container">
  <h2>📱 Scan QR in Google Authenticator</h2>
  <img src="${qr}" />
  <p>Manual Key: ${secret.base32}</p>
  <a href="/verify-2fa">Next →</a>
</div>

</body>
</html>
`);
}); 
/* ================= VERIFY PAGE ================= */
app.get("/verify-2fa", (req, res) => {
  res.send(`
  <html>
  <head>
    <link rel="stylesheet" href="/style.css">
  </head>
  <body>
    <div class="container">
      <h2>Enter 2FA Code</h2>
      <form method="POST" action="/verify-2fa">
        <input name="token" placeholder="Enter 6-digit code" required />
        <button type="submit">Verify</button>
      </form>
    </div>
  </body>
  </html> 
`);
});

app.post("/verify-2fa", (req, res) => {
  const { token } = req.body;

  const verified = speakeasy.totp.verify({
    secret: secret.base32,
    encoding: "base32",
    token: token,
    window: 1
  });

  if (verified) {
    req.session.is2FA = true;
    return res.redirect("/dashboard");
  } else {
    return res.send("❌ Invalid code");
  }
});

/* ================= DASHBOARD ================= */
app.get("/dashboard", (req, res) => {
  if (!req.session.loggedIn || !req.session.is2FA) {
    return res.redirect("/");
  }

  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

/* ================= LOG API ================= */
app.get("/api/logs", (req, res) => {
  if (!req.session.loggedIn || !req.session.is2FA) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  if (!fs.existsSync("attacks.log")) {
    return res.json([]);
  }

  const data = fs.readFileSync("attacks.log", "utf8")
    .split("\n")
    .filter(line => line)
    .map(line => JSON.parse(line));

  res.json(data);
});

/* ================= VIRUSTOTAL ================= */
const API_KEY = process.env.VT;

async function checkIP(ip) {
  try {
    const response = await axios.get(
      `https://www.virustotal.com/api/v3/ip_addresses/${ip}`,
      { headers: { "x-apikey": API_KEY } }
    );

    const stats = response.data.data.attributes.last_analysis_stats;

    return {
      malicious: stats.malicious,
      suspicious: stats.suspicious,
      harmless: stats.harmless
    };
  } catch (err) {
    console.error("VT error:", err.message);
    return null;
  }
}

/* ================= CHECK VT ================= */
app.get("/check-vt", async (req, res) => {
  try {
    if (!fs.existsSync("attacks.log")) {
      return res.send("No logs found");
    }

    const logs = fs.readFileSync("attacks.log", "utf8")
      .split("\n")
      .filter(line => line)
      .map(line => JSON.parse(line));

    const uniqueIPs = [...new Set(logs.map(l => l.ip))];

    let maliciousIPs = [];

    for (let ip of uniqueIPs) {
      if (ip === "127.0.0.1") continue;

      const result = await checkIP(ip);
      if (result && result.malicious > 0) {
        maliciousIPs.push({ ip, result });
      }
    }

    res.send(`
<html>
<head>
  <title>VirusTotal Scan</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>

<div class="container">
  <h1>🦠 VirusTotal Scan</h1>

  ${
    maliciousIPs.length === 0
      ? '<p>✅ No malicious IP found</p>'
      : maliciousIPs.map(m => `
          <p>🔴 ${m.ip} → ${m.result.malicious}</p>
        `).join("")
  }

  <br>
  <a href="/dashboard" class="dashboard-btn">⬅ Back</a>
</div>

</body>
</html>
`);

  } catch (err) {
    console.error(err);
    res.send("Error");
  }
});

/* ================= AI SUMMARY ================= */
app.get("/ai-summary", async (req, res) => {
  try {
    const logs = fs.readFileSync("attacks.log", "utf8")
      .split("\n")
      .filter(line => line)
      .slice(-3)
      .map(line => JSON.parse(line));

    const prompt = `
Analyze logs:
${JSON.stringify(logs)}
Return summary only.
`;

    const response = await axios.post("http://127.0.0.1:11434/api/generate", {
      model: "qwen2.5",
      prompt,
      stream: false
    });

    res.send(`
      <h2>AI Summary</h2>
      <pre>${response.data.response}</pre>
      <a href="/dashboard">Back</a>
    `);

  } catch (err) {
    console.error(err);
    res.send("AI Error");
  }
});


app.get("/clear-logs", (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect("/");
  }

  const fs = require("fs");

  fs.writeFileSync("attacks.log", "");
  res.redirect("/dashboard");
});



/* ================= LOGOUT ================= */
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

/* ================= START ================= */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

/* ================= ERROR HANDLER ================= */
process.on("uncaughtException", err => {
  console.error("ERROR:", err);
});
