const express = require("express");
const GameEngine = require("./services/gameEngine");
const bodyParser = require("body-parser");
const dotenv = require('dotenv');
const cors = require('cors');
const GameController = require("./gameController");
const AdminController = require("./adminController");

GameEngine.isDemoMode = process.env.DEMO_MODE === "true";

const PORT = process.env.PORT;

const app = express();
app.use(bodyParser.json());
app.use(cors({
    origin: ["http://localhost:3000", /^[http://192.168]/, "https://debanjan1992.github.io"]
}));

app.use("/api", GameController);
app.use("/admin", AdminController);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});