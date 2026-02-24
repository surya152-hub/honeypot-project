🛡️  Honeypot Login System
 
A lightweight security honeypot built using Node.js, Express, and Ollama (LLM integration).
 
This project simulates a fake admin login portal to capture malicious login attempts and uses a local AI model to analyze attack patterns.
 
 
---
 
📌 Project Description
 
This honeypot system is designed to:
 
Capture unauthorized login attempts
 
Log attacker details (IP, username, password, timestamp)
 
Store logs securely in attacks.log
 
Generate AI-based attack summaries using Ollama
 
Display captured attacks inside a protected dashboard
 
 
The system is optimized to run inside a low-RAM Ubuntu Virtual Machine.
 
 
---
 
🚀 Features
 
🔐 Honeypot Login Page
 
Fake admin login portal
 
Captures IP address automatically
 
Logs username and password attempts
 
 
📊 Secure Dashboard
 
Protected using session authentication
 
Displays captured attack logs
 
Shows recent attack activity
 
 
🤖 AI Attack Summary (Ollama Integration)
 
Processes last 20 logs (RAM optimized)
 
Generates:
 
Total number of attacks
 
Top attacking IP
 
Suspicious behavior summary
 
Type of attacks
 
 
 
⚙️ Performance Optimized
 
Lightweight model (phi supported)
 
Works on 2GB–4GB RAM VM
 
Limits log processing for speed
 
 
 
---
 
🏗️ Technologies Used
 
Node.js
 
Express.js
 
Express-session
 
File System (fs)
 
Ollama (Local LLM)
 
Ubuntu (VMware)
 
 
 
---
 
📂 Project Structure
 
honeypot-project/
│
├── public/
│   ├── index.html
│   ├── dashboard.html
│   └── dashboard.css
│
├── screenshots/
├── server.js
├── package.json
├── package-lock.json
├── attacks.log
└── README.md
 
 
---
 
⚡ Installation & Setup
 
1️⃣ Clone Repository
 
git clone https://github.com/your-username/honeypot-project.git
cd honeypot-project
 
2️⃣ Install Dependencies
 
npm install
 
3️⃣ Install Ollama
 
Install Ollama from official website.
 
Pull lightweight model:
 
ollama pull phi
 
4️⃣ Run Server
 
node server.js
 
Server will run on:
 
http://localhost:3000
 
 
---
 
🔎 AI Route
 
To generate AI attack summary:
 
http://localhost:3000/ai-summary
 
 
 
---

 
---
 
⚠️ Disclaimer
 
This project is built strictly for educational purposes. Do not use it for illegal activities.

