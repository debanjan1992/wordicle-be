const { nanoid } = require("nanoid");
const pool = require("./../db");
const TABLE_NAME = "sessions";

class SessionsService {
    static createNewSession(word, done) {
        const sessionId = nanoid();
        const startTime = `${new Date().getTime()}`;
        pool.query('INSERT INTO "public"."' + TABLE_NAME + '" (id, word, start_time) VALUES ($1, $2, $3)', [sessionId, word.toUpperCase(), startTime], (error, results) => {
            if (error) {
                throw error;
            } else {
                done(sessionId, startTime, word.length);
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
        pool.query('SELECT * FROM "public"."' + TABLE_NAME + '" LIMIT 10000', [], (error, results) => {
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

    static endSession(sessionId, done) {
        const endTime = `${new Date().getTime()}`;
        pool.query('UPDATE "public"."' + TABLE_NAME + '" SET end_time = $1 WHERE id = $2', [endTime, sessionId], (error, results) => {
            if (error) {
                console.error(error);
            } else {
                done(endTime);
            }
        });
    }
}

module.exports = SessionsService;