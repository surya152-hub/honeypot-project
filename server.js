const express = require('express');
const fs = require('fs');
const app = express();
 
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.listen(80, () => {
    console.log("Honeypot running on port 80");
}); 
app.use((req, res) => {
 
    const log = `
TIME: ${new Date()}
IP: ${req.ip.replace('::fff:',")}
METHOD: ${req.method}
URL: ${req.url}
BODY: ${JSON.stringify(req.body)}
--------------------------
`;
 
    console.log(log);
    fs.appendFileSync("attacks.log", log);
 
    res.sendFile(__dirname + "/public/index.html");
});
 
