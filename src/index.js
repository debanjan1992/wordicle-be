const express = require("express");
const GameEngine = require("./services/gameEngine");
const bodyParser = require("body-parser");
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require("fs");
const path = require("path");
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
    origin: ["http://localhost:3000", "http://192.168.1.107:3000", "https://debanjan1992.github.io"]
}));

app.get("/api/logs", (req, res) => {
    const LOG_FILE_PATH = path.join(__dirname, "../", "info.log");
    res.sendFile(LOG_FILE_PATH);
});

app.get("/api/sessions", (req, res) => {
    let sessions;
    sessions = JSON.parse(fs.readFileSync(SESSIONS_FILE_PATH));
    res.json({ sessions: Object.keys(sessions) });
});

app.get("/api/reveal", (req, res) => {
    const sessionId = req.query.sessionId;
    res.json({
        success: true,
        data: GameEngine.getWordFromSession(sessionId)
    });
});

app.get("/api/word", (req, res) => {
    res.json(GameEngine.getRandomWord());
});

app.get("/api/session/valid", (req, res) => {
    res.json({ valid: GameEngine.isSessionValid(req.query.id) });
});

app.get("/api/clear", (req, res) => {
    GameEngine.clearAllSessions();
    res.json({ success: true });
});

app.post("/api/submit", (req, res) => {
    const answer = req.body.word;
    const sessionId = req.body.sessionId;
    GameEngine.submitAnswer(sessionId, answer).then(response => {
        res.json({ success: true, data: response, word: answer });
    }).catch(error => {
        res.status(400).json({ success: false, message: error });
    })
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});