const express = require("express");
const fs = require("fs");
const path = require("path");
const session = require("express-session");
 
const app = express();
 
const ADMIN_USER = "admin";
const ADMIN_PASS = "admin123";
 
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
 
app.use(session({
    secret: "honeypotsecret",
    resave: false,
    saveUninitialized: true
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
 
// Login handler
app.post("/login", (req, res) => {
    const { username, password } = req.body;
 
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        req.session.loggedIn = true;
        return res.redirect("/dashboard");
    }
 
    res.send("❌ Invalid credentials");
});
 
// Dashboard (protected)
app.get("/dashboard", (req, res) => {
 
    if (!req.session.loggedIn) {
        return res.redirect("/");
    }
 
    res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});
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
app.listen(80, () => {
    console.log("Honeypot running on port 80");
});
