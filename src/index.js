const express = require("express");
const GameEngine = require("./services/gameEngine");
const bodyParser = require("body-parser");
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require("fs");
const path = require("path");
dotenv.config();

const SESSIONS_FILE_PATH = path.join(__dirname, "../", "data", "sessions.json");
if (!fs.existsSync(SESSIONS_FILE_PATH)) {
    fs.writeFileSync(SESSIONS_FILE_PATH, JSON.stringify({}));
}

GameEngine.isDemoMode = process.env.DEMO_MODE === "true";

const PORT = process.env.PORT;

const app = express();
app.use(bodyParser.json());
app.use(cors({
    origin: ["http://localhost:3000", "https://debanjan1992.github.io"]
}));

app.get("/api/healthcheck", (req, res) => {
    res.json({
        success: true,
        message: "We are up and running!"
    });
});

app.get("/api/reveal", (req, res) => {
    const sessionId = req.query.sessionId;
    res.json({
        success: true,
        data: GameEngine.getWordFromSession(sessionId)
    });
});

app.get("/api/word", (req, res) => {
    const sessionId = req.query.sessionId;
    if (sessionId !== "null") {
        GameEngine.clearSession(sessionId);
    }
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
        res.status(400).json({ success: false, message: "Not found!" });
    })
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});