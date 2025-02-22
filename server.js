const express = require("express");
const fs = require("fs");
const useragent = require("useragent");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Serve the tracking script
app.get("/track.js", (req, res) => {
    res.setHeader("Content-Type", "application/javascript");
    res.send(`
        (function() {
            fetch('/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    referrer: document.referrer,
                    userAgent: navigator.userAgent,
                    screenSize: screen.width + 'x' + screen.height,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                })
            });
        })();
    `);
});

// Track data
app.post("/track", (req, res) => {
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const agent = useragent.parse(req.body.userAgent);

    const logData = {
        ip,
        time: new Date().toISOString(),
        browser: agent.family,
        os: agent.os.toString(),
        device: agent.device.toString(),
        referrer: req.body.referrer,
        screenSize: req.body.screenSize,
        timezone: req.body.timezone
    };

    console.log(logData);

    fs.appendFileSync("logs.json", JSON.stringify(logData) + ",\n");

    res.sendStatus(200);
});

// Report issue
app.post("/report", (req, res) => {
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    const reportData = {
        ip,
        time: new Date().toISOString(),
        message: req.body.message || "No message provided",
        userAgent: req.body.userAgent,
        screenSize: req.body.screenSize,
        referrer: req.body.referrer,
        timezone: req.body.timezone
    };

    console.log("Error Report:", reportData);

    fs.appendFileSync("reports.json", JSON.stringify(reportData) + ",\n");

    res.sendStatus(200);
});

// Export for Vercel
module.exports = app;
