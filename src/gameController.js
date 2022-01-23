const express = require('express');
const GameEngine = require("./services/gameEngine");
const router = express.Router();

router.get("/newGame", GameEngine.startNewGame);
router.get("/session", GameEngine.getSessionDetails);
router.post("/submit", GameEngine.submitWord);
router.get("/reveal", GameEngine.revealWord);

module.exports = router;