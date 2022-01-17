const express = require("express");
const cors = require("cors");
const PORT = process.env.PORT || 4000;
const GameEngine = require("./services/gameEngine");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get("/api/healthcheck", (req, res) => {
    res.json({
        success: true,
        message: "We are up and running!"
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

app.listen(PORT, () => `Server running on port ${PORT}`);