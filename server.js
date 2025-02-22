import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import { config } from "dotenv";
import useragent from "useragent";

config();

const app = express();
const PORT = process.env.PORT || 3000;
const client = new MongoClient(process.env.MONGODB_URI);

app.use(cors());
app.use(express.json());

// Connect to MongoDB
async function connectDB() {
    try {
        await client.connect();
        console.log("Connected to MongoDB ✅");
    } catch (err) {
        console.error("MongoDB connection error ❌", err);
        process.exit(1);
    }
}

connectDB();

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
app.post("/track", async (req, res) => {
    const db = client.db("analyticsDB"); // Change to your DB name
    const collection = db.collection("tracking");

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

    try {
        await collection.insertOne(logData);
        console.log("Tracking data saved ✅", logData);
        res.sendStatus(200);
    } catch (error) {
        console.error("Error saving tracking data ❌", error);
        res.sendStatus(500);
    }
});

// Report issue
app.post("/report", async (req, res) => {
    const db = client.db("analyticsDB"); // Change to your DB name
    const collection = db.collection("reports");

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

    try {
        await collection.insertOne(reportData);
        console.log("Report saved ✅", reportData);
        res.sendStatus(200);
    } catch (error) {
        console.error("Error saving report ❌", error);
        res.sendStatus(500);
    }
});

// Export for Vercel
export default app;
