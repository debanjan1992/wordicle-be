const { nanoid } = require("nanoid");
const pool = require("./../db");
const TABLE_NAME = "Sessions";

class SessionsService {
    static createNewSession(word, done) {
        const sessionId = nanoid();
        const timestamp = `${new Date().getTime()}`;
        pool.query('INSERT INTO "public"."' + TABLE_NAME + '" (id, word, timestamp) VALUES ($1, $2, $3)', [sessionId, word.toUpperCase(), timestamp], (error, results) => {
            if (error) {
                throw error;
            } else {
                done(sessionId, word.length);
            }
        });
    }

    static getSessionDetails(sessionId, done) {
        pool.query('SELECT * FROM "public"."' + TABLE_NAME + '" WHERE id = $1', [sessionId], (error, results) => {
            if (error) {
                throw error;
            } else {
                if (results.rows.length === 0) {
                    done(null);
                } else {
                    done(results.rows[0]);
                }
            }
        });
    }

    static getAllSessionDetails(done) {
        pool.query('SELECT * FROM "public"."' + TABLE_NAME + '" LIMIT 100', [], (error, results) => {
            if (error) {
                throw error;
            } else {
                done(results.rows);
            }
        });
    }

    static deleteSessions(sessionIds, done) {
        const dollarSyntax = Array.from({ length: 8 }, (k, x) => '$' + (x + 1)).join(", ");
        pool.query(`DELETE FROM "public"."${TABLE_NAME}" WHERE id IN [${dollarSyntax}]`, sessionIds, (error, results) => {
            if (error) {
                throw error;
            } else {
                done(true);
            }
        });
    }
}

module.exports = SessionsService;