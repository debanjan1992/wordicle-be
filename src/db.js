const { Client } = require("pg");
const dotenv = require("dotenv");
dotenv.config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

client.connect().then(s => {
    console.log("Database connected!");
});

module.exports = client;

