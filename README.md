🔥 Honeypot Login System (AI-Powered)

A lightweight security honeypot built using Node.js, Express, and Ollama (LLM integration).

This project simulates a fake admin login portal to capture malicious login attempts and uses a local AI model (Qwen2.5) to analyze attack patterns in real-time. But only with the correct username and password we can we the details of pages and go to the dashboard.

---

🚀 Project Overview

This honeypot system is designed to:

- 🎯 Capture unauthorized login attempts
- 🌐 Log attacker details (IP, username, password, timestamp)
- 🧠 Analyze logs using local AI (Ollama - Qwen2.5)
- 📊 Display attacks in a protected dashboard
- 🔒 Block repeated attackers (rate-limiting system)

---

⚡ Features

🧑‍💻 Honeypot Login Page

- Fake admin login interface 
- Tracks attacker IP automatically
- Logs credentials attempts

🔐 Security System

- IP-based rate limiting
- Auto block after multiple failed attempts
- Temporary IP blocking (2 minutes)

📊 Dashboard

- Displays captured attack logs
- Shows time, IP, method, URL
- Filter logs by IP

🤖 AI Attack Summary

- Uses Ollama (Qwen2.5 model)
- Analyzes last logs
- Generates:
  - Total number of attacks
  - Suspicious behavior summary
  - Type of attacks
  - Activity patterns

⚙️ Performance Optimized

- Works on low RAM (2GB–4GB VM)
- Processes limited logs for speed
- Lightweight backend

---

🛠️ Technologies Used

- Node.js
- Express.js
- Express-session
- File System (fs)
- Ollama (Local LLM - Qwen2.5)
- Ubuntu (VMware)

---

📂 Project Structure

honeypot-project/
│
├── public/
│   ├── index.html
│   ├── dashboard.html
│   └── style.css
│
├── server.js
├── package.json
├── package-lock.json
├── attacks.log
└── README.md

---

⚙️ Installation & Setup

1️⃣ Clone Repository

git clone https://github.com/your-username/honeypot-project.git
cd honeypot-project

2️⃣ Install Dependencies

npm install

3️⃣ Install Ollama

Download from: https://ollama.com

Pull model:

ollama pull qwen2.5

Run Ollama:

ollama serve

---

4️⃣ Run Server

node server.js

Server will run on:

http://localhost:3000

---

📱 Access from Mobile (Same WiFi)

Use your system IP:

http://YOUR-IP:3000

Example:

http://192.168.119.131:3000

---

🧠 AI Feature

To generate AI summary:

/ai-summary

✔ Uses local AI
✔ No internet required
✔ Fast & secure

---

⚠️ Security Note

This project is for educational purposes only.

❌ Do NOT deploy publicly without proper security
❌ Do NOT use for illegal activities

---

👨‍💻 Author

Developed by Surya

---


