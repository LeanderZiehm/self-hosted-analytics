import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import { config } from "dotenv";
import useragent from "useragent";

config();

const app = express();

app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;


app.get("/", (req, res) => {
    const theURLofNODEJSserver = "https://" + req.get('host');
    res.send(`you have to add  < script src="${theURLofNODEJSserver}/track.js"></script>  to your page`);
}
);

app.get("/track.js", (req, res) => {
    const theURLofNODEJSserver = "https://" + req.get('host');
    res.setHeader("Content-Type", "application/javascript");
    res.send(`
        (function() {
            var scriptSrc = document.currentScript ? document.currentScript.src : '';
            var baseUrl = "${theURLofNODEJSserver}";
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
    const client = new MongoClient(MONGO_URI);
    const db = client.db("analyticsDB"); // Change to your DB name
    const collection = db.collection("tracking");

    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const agent = useragent.parse(req.body.userAgent);

    const logData = {
        url: req.body.url, // Store the visited URL
        ip: ip,
        time: new Date().getTime(),
        dateString: new Date().toISOString(),
        userAgent: req.body.userAgent,
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


// Fetch analytics data
app.get("/analytics", async (req, res) => {
    const client = new MongoClient(MONGO_URI);
    const db = client.db("analyticsDB");
    const collection = db.collection("tracking");

    try {
        const analyticsData = await collection.find({}).toArray();
        res.json(analyticsData);
    } catch (error) {
        console.error("Error fetching analytics data ❌", error);
        res.sendStatus(500);
    } finally {
        await client.close();
    }
});

export default app;
