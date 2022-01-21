const express = require("express");
const GameEngine = require("./services/gameEngine");
const bodyParser = require("body-parser");
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require("fs");
const path = require("path");
const SessionsService = require("./services/sessionsService");
const AnalyticsService = require("./services/analyticsService");
dotenv.config();

const SESSIONS_FILE_PATH = path.join(__dirname, "../", "sessions.json");
if (!fs.existsSync(SESSIONS_FILE_PATH)) {
    fs.writeFileSync(SESSIONS_FILE_PATH, JSON.stringify({}));
}

GameEngine.isDemoMode = process.env.DEMO_MODE === "true";

const PORT = process.env.PORT;

const app = express();
app.use(bodyParser.json());
app.use(cors({
    origin: ["http://localhost:3000", /^[http://192.168]/, "https://debanjan1992.github.io"]
}));

app.get("/api/logs", (req, res) => {
    const LOG_FILE_PATH = path.join(__dirname, "../", "info.log");
    res.sendFile(LOG_FILE_PATH);
});

app.get("/api/sessions", (req, res) => {
    SessionsService.getAllSessionDetails(results => {
        res.json({ sessions: results.length });
    });
});

app.get("/api/reveal", (req, res) => {
    const sessionId = req.query.sessionId;
    SessionsService.getSessionDetails(sessionId, (data) => {
        AnalyticsService.getStatsForWord(data.word, stats => {
            res.json({
                success: true,
                data: data.word,
                stats: {
                    totalHits: stats !== null ? stats.count : null,
                    fastestTimeInMinutes: stats !== null ? stats.time : null
                }
            });
        });
    })
});

app.get("/api/word", (req, res) => {
    GameEngine.getRandomWord((id, length) => {
        res.json({ id, length });
    })
});

app.get("/api/session/valid", (req, res) => {
    GameEngine.isSessionValid(req.query.id, (isValid) => res.json({ valid: isValid }))
});

app.post("/api/submit", (req, res) => {
    const answer = req.body.word;
    const sessionId = req.body.sessionId;
    GameEngine.submitAnswer(sessionId, answer, (response) => {
        if (response.success) {
            res.json({ success: true, data: response.data, word: answer });
        } else {
            res.status(400).json({ success: false, message: response.data });
        }
    })
});

app.get("/api/cleanSessions", (req, res) => {
    SessionsService.getAllSessionDetails(sessions => {
        const currentTimeStamp = new Date().getTime();
        const sessionsToBeDeleted = [];
        sessions.forEach(session => {
            const diffInDays = Math.floor((currentTimeStamp - +session.timestamp) / (1000 * 60 * 60 * 24));
            if (diffInDays > 0) {
                sessionsToBeDeleted.push(session.id);
            }
        });
        if (sessionsToBeDeleted.length) {
            SessionsService.deleteSessions(sessionsToBeDeleted, () => res.json({ success: true, data: sessionsToBeDeleted }));
        } else {
            res.json({ success: false, message: "No sessions to be deleted" })
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});