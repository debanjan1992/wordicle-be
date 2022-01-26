const pool = require("./../db");
const TABLE_NAME = "analytics";

class AnalyticsService {
    static addNewWord(word, timeTaken, done) {
        pool.query('INSERT INTO "public"."' + TABLE_NAME + '" (word, best_time, count, avg_time) VALUES ($1, $2, $3, $2)', [word.toUpperCase(), timeTaken, 1], (error, results) => {
            if (error) {
                console.error(error);
            } else {
                done && done();
            }
        });
    }

    static getStatsForWord(word, done) {
        pool.query('SELECT * FROM "public"."' + TABLE_NAME + '" WHERE word = $1', [word.toUpperCase()], (error, results) => {
            if (error) {
                console.error(error);
                done && done(null);
            } else {
                if (results.rows.length === 0) {
                    done && done(null);
                } else {
                    done && done(results.rows[0]);
                }
            }
        });
    }

    static updateForWord(word, count, bestTime, avgTime, done) {
        pool.query('UPDATE "public"."' + TABLE_NAME + '" SET count = $1, best_time = $2, avg_time = $3 WHERE word = $4', [count, bestTime, avgTime, word.toUpperCase()], (error, results) => {
            if (error) {
                console.error(error);
            } else {
                done && done(results);
            }
        });
    }
}

module.exports = AnalyticsService;