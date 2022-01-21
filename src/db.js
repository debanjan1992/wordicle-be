const { Pool } = require("pg");
const dotenv = require("dotenv");
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://me:wordicle@localhost/wordicle?schema=public',
    ssl: process.env.DATABASE_URL ? {
        rejectUnauthorized: false
    } : false
});

module.exports = pool;