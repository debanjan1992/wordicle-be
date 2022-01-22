const express = require('express');
const SessionsService = require("./services/sessionsService");
const AnalyticsService = require("./services/analyticsService");
const GameEngine = require("./services/gameEngine");
const path = require("path");
const router = express.Router();

router.get("/newGame", GameEngine.startNewGame);
router.get("/session/valid", GameEngine.isSessionValid);
router.post("/submit", GameEngine.submitWord);

router.get("/word", (req, res) => { // to delete
    res.redirect("/api/newGame");
});


router.get("/reveal", GameEngine.revealWord);

module.exports = router;