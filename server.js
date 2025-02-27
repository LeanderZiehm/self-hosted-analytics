import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import { config } from "dotenv";
import useragent from "useragent";

config();

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());

// Connect to MongoDB
// async function connectDB() {
//     try {
//         await client.connect();
//         console.log("Connected to MongoDB ✅");
//     } catch (err) {
//         console.error("MongoDB connection error ❌", err);
//         process.exit(1);
//     }
// }

// connectDB();

app.get("/track.js", (req, res) => {
    res.setHeader("Content-Type", "application/javascript");
    res.send(`
        (function() {
            var scriptSrc = document.currentScript ? document.currentScript.src : '';
            var baseUrl = "https://self-hosted-analytics.vercel.app/";
            
            fetch(baseUrl + '/track', {
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

app.post("/track", async (req, res) => {
    const client = new MongoClient(process.env.MONGO_URI);
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
    } finally {
        await client.close();
    }
});

export default app;
