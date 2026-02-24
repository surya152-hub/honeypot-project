const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
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












app.get("/ai-summary", async (req, res) => {
    console.log("AI route triggered");
 
    try {
        const logs = fs.readFileSync("attacks.log", "utf8")
          .split("\n") 
          .slice(-2)
          .join("\n");
 
        const prompt = `
These are real honeypot attack logs.
Extract:
- Total attacks
- IP address
- What attacker tried
 
Logs:
${logs} 
Do not explain what honeypot is.
Only analyze the logs.
 `;
 console.log("sending request to ollama...");
        const response = await axios.post(
            "http://127.0.0.1:11434/api/generate",
            {
                model: "tinyllama:latest",
                prompt: prompt,
                stream: false
            },
{
       timeout:220000
                      }
        );
 
        console.log("Got response from Ollama");
 
        res.send(`
            <h1>🔥 AI Attack Summary</h1>
            <pre>${response.data.response}</pre>
            <a href="/dashboard">Back</a>
        `);
 
    } catch (err) {
        console.error(err);
        res.send("AI Error");
    }
});









 

app.listen(3000, () => {
    console.log("Honeypot running on port 3000");
});
