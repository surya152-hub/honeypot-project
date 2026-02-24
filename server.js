const express = require("express");
const fs = require("fs");
const path = require("path");
const session = require("express-session");
 
const app = express();
 
const ADMIN_USER = "admin";
const ADMIN_PASS = "admin123";
const failedAttempts ={};
const MAX_ATTEMPTS =5;
const BLOCK_TIME = 2*60*1000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
 
app.use(session({
    secret: "honeypotsecret",
    resave: false,
    saveUninitialized: false
}));
 
// Log everything except dashboard
app.use((req, res, next) => {
    if (req.originalUrl === "/dashboard") {
        return next();
    }
 
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
 
// Login page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});









//LOGIN HANDLER //
 
   app.post("/login", (req, res) => {
    const ip = req.ip;
    const { username, password } = req.body;
 
    // If IP is blocked
    if (failedAttempts[ip] && failedAttempts[ip].blockedUntil > Date.now()) {
        return res.send("🚫 Too many attempts. Try later.");
    }
 
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        failedAttempts[ip] = { count: 0 };
        req.session.loggedIn = true;
        return res.redirect("/dashboard");
    }
 
    // Wrong login
    if (!failedAttempts[ip]) {
        failedAttempts[ip] = { count: 0 };
    }
 
    failedAttempts[ip].count++;
 
    if (failedAttempts[ip].count >= MAX_ATTEMPTS) {
        failedAttempts[ip].blockedUntil = Date.now() + BLOCK_TIME;
        return res.send("🚫 IP Blocked for 2 minutes.");
    }
 
    res.send("❌ Invalid credentials");
});
 

 

//logout route//
app.get("/logout",(req,res)=>{
req.session.destroy((err)=> {
if(err){
console.log(err);
return res.redirect("/");
}
res.clearCookie("connect.sid");
res.redirect("/");
});
});

app.get("/clear-logs", (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect("/");
    }
 
    fs.writeFileSync("attacks.log", "");
    res.redirect("/dashboard");
});





// Dashboard (protected)
app.get("/dashboard", (req, res) => {
 
    if (!req.session.loggedIn) {
        return res.redirect("/");
    }
 
    res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});


//api logs//
app.get("/api/logs", (req, res) => {
 
    if (!req.session.loggedIn) {
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










const { spawn } = require("child_process");
 
app.get("/ai-summary", (req, res) => {
 
    if (!req.session.loggedIn) {
        return res.redirect("/");
    }
 
    if (!fs.existsSync("attacks.log")) {
        return res.send("No logs available.");
    }
 
    let logs = fs.readFileSync("attacks.log", "utf8")
        .split("\n")
        .slice(-4)   // only last 4  logs (important for speed)
        .join("\n");
 
    const prompt = `
Analyze these honeypot attack logs and provide:
1. Total attacks
2. Top attacking IP
3. Suspicious behavior summary
4. Type of attacks
 
Logs:
${logs}
`;
 
    const ollama = spawn("ollama", ["run", "phi"]);
    ollama.stdin.write(prompt);
    ollama.stdin.end();
 
    let output = "";
 
    ollama.stdout.on("data", (data) => {
        output += data.toString();
    });
 
    ollama.stderr.on("data", (data) => {
        console.error("Ollama error:", data.toString());
    });
 
    ollama.on("close", () => {
        res.send(`
            <h1>🤖 AI Attack Summary</h1>
            <pre>${output}</pre>
            <a href="/dashboard">Back</a>
        `);
    });
 
});   
 











 

app.listen(3000, () => {
    console.log("Honeypot running on port 80");
});
