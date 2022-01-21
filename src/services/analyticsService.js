const pool = require("./../db");
const TABLE_NAME = "analytics";

class AnalyticsService {
    static addNewWord(word, timeTaken, done) {
        pool.query('INSERT INTO "public"."' + TABLE_NAME + '" (word, time, count) VALUES ($1, $2, $3)', [word.toUpperCase(), timeTaken, 1], (error, results) => {
            if (error) {
                console.error(error);
            } else {
                done();
            }
        });
    }

    static getStatsForWord(word, done) {
        pool.query('SELECT * FROM "public"."' + TABLE_NAME + '" WHERE word = $1', [word.toUpperCase()], (error, results) => {
            if (error) {
                console.error(error);
                done(null);
            } else {
                if (results.rows.length === 0) {
                    done(null);
                } else {
                    done(results.rows[0]);
                }
            }
        });
    }

    static addCountForWord(word, done) {
        this.getStatsForWord(word, stats => {
            if (stats === null) {
                done();
            } else {
                const count = +stats.count + 1;
                pool.query('UPDATE "public"."' + TABLE_NAME + '" SET count = $1 WHERE word = $2', [count, word.toUpperCase()], (error, results) => {
                    if (error) {
                        console.error(error);
                    } else {
                        done(results);
                    }
                });
            }
        });
    }

    static updateFastestTimeForWord(word, fastestTimeInMinutes, done) {
        pool.query('UPDATE "public"."' + TABLE_NAME + '" SET time = $1 WHERE word = $2', [fastestTimeInMinutes, word.toUpperCase()], (error, results) => {
            if (error) {
                console.error(error);
            } else {
                done(results);
            }
        });
    }
}

module.exports = AnalyticsService;