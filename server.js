import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import { config } from "dotenv";
import useragent from "useragent";

config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/track.js", (req, res) => {


 
    const theURLofNODEJSserver = "https://" + req.get('host');

    res.setHeader("Content-Type", "application/javascript");
    res.send(`
        (function() {
            var scriptSrc = document.currentScript ? document.currentScript.src : '';
            var baseUrl = ${theURLofNODEJSserver};
            console.log("tracking");
            
            fetch(baseUrl + '/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: window.location.href,  // Capture the current URL
                    referrer: document.referrer,
                    userAgent: navigator.userAgent,
                    screenSize: screen.width + 'x' + screen.height,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    language: navigator.language, // Capture browser language
                    platform: navigator.platform // Capture OS platform
                })
            });
        })();
    `);
});

app.post("/track", async (req, res) => {
    const client = new MongoClient(process.env.MONGO_URI);
    const db = client.db("analyticsDB"); // Change to your DB name
    const collection = db.collection("tracking");

    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const agent = useragent.parse(req.body.userAgent);

    const logData = {
        ip,
        time: new Date().toISOString(),
        userAgent: req.body.userAgent,
        url: req.body.url, // Store the visited URL
        browser: agent.family,
        os: agent.os.toString(),
        device: agent.device.toString(),
        screenSize: req.body.screenSize,
        timezone: req.body.timezone,
        language: req.body.language, // Store browser language
        platform: req.body.platform, // Store OS platform
        referrer: req.body.referrer
    };

    try {
        await collection.insertOne(logData);
        console.log("Tracking data saved ✅", logData);
        res.sendStatus(200);
    } catch (error) {
        console.error("Error saving tracking data ❌", error);
        res.sendStatus(500);
    } finally {
        await client.close();
    }
});

app.get("/email-track", async (req, res) => {
    const client = new MongoClient(process.env.MONGO_URI);
    const db = client.db("analyticsDB");
    const collection = db.collection("email_tracking");

    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];
    const agent = useragent.parse(userAgent);

    const logData = {
        email: req.query.email || "unknown", // Capture email if provided
        ip,
        time: new Date().toISOString(),
        browser: agent.family,
        os: agent.os.toString(),
        device: agent.device.toString(),
        referrer: req.headers["referer"] || "unknown"
    };

    try {
        await collection.insertOne(logData);
        console.log("Email tracking data saved ✅", logData);
    } catch (error) {
        console.error("Error saving email tracking data ❌", error);
    } finally {
        await client.close();
    }

    // Send a 1x1 transparent pixel image
    const pixel = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/eqQbQAAAABJRU5ErkJggg==",
        "base64"
    );
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Length", pixel.length);
    res.end(pixel);
});


export default app;
