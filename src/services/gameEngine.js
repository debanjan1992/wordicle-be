const fs = require("fs");
const path = require("path");
const log4js = require("log4js");
const SessionsService = require("./sessionsService");
const AnalyticsService = require("./analyticsService");
log4js.configure({
    appenders: {
        wordicle: { type: "file", filename: "info.log" },
    },
    categories: {
        default: { appenders: ["wordicle"], level: "info" },
    }
});

const logger = log4js.getLogger("wordicleError");
class GameEngine {

    static isDemoMode = false;
    static DEMO_WORD = "BREAK";
    static WORDS_FILE_PATH = path.join(__dirname, "../", "data", "words.json");
    static WORDS_DICTIONARY_FILE_PATH = path.join(__dirname, "../", "data", "words_dictionary.json");

    static getRandomWord(done) {
        try {
            if (this.isDemoMode) {
                SessionsService.createNewSession(this.DEMO_WORD, done);
            } else {
                const dataset = JSON.parse(fs.readFileSync(this.WORDS_FILE_PATH));
                let isFound = false;
                let word;
                while (!isFound) {
                    const index = Math.floor(Math.random() * dataset.length);
                    word = dataset[index].word.value;
                    if (word.length > 3 && word.length <= 7) {
                        isFound = true;
                    }
                }
                SessionsService.createNewSession(word, done);
            }
        } catch (e) {
            logger.info("Failed to get random word: " + e);
        }
    }

    static isSessionValid(id, done) {
        SessionsService.getSessionDetails(id, (data) => done(data !== null));
    }

    static isValidWord(word) {
        if (this.isDemoMode) {
            return true;
        } else {
            const dictionary = JSON.parse(fs.readFileSync(this.WORDS_DICTIONARY_FILE_PATH));
            if (dictionary[word.toLowerCase()]) {
                return true;
            } else {
                return false;
            }
        }
    }

    static isGameComplete = (mapping) => {
        return mapping.reduce((acc, code) => {
            if (code === "correct") {
                acc = acc + 1;
            }
            return acc;
        }, 0) === mapping.length;
    };

    static submitAnswer(sessionId, answer, done) {
        if (!this.isValidWord(answer)) {
            logger.info(`Word not found in dictionary - ${sessionId}`, answer);
            done({ success: false, data: "Invalid Word" });
        } else {
            SessionsService.getSessionDetails(sessionId, session => {
                if (session === null) {
                    logger.info("Invalid Session", sessionId);
                    done({ success: false, data: "Invalid Session" });
                } else {
                    try {
                        const output = [];
                        for (let i = 0; i < session.word.length; i++) {
                            const character = session.word[i];
                            if (character.toLowerCase() === answer[i].toLowerCase()) {
                                output[i] = "correct";
                            } else {
                                output[i] = "absent";
                            }
                            if (output[i] !== "correct" && session.word.toLowerCase().includes(answer[i].toLowerCase())) {
                                output[i] = "present";
                            }
                        }

                        if (this.isGameComplete(output)) {
                            AnalyticsService.getStatsForWord(answer, stats => {
                                const timeInMinutes = (new Date().getTime() - +session.timestamp) / (1000 * 60);
                                if (stats !== null) {
                                    AnalyticsService.addCountForWord(answer, () => {
                                        if (timeInMinutes < stats.time && (timeInMinutes * 60) > 30) {
                                            AnalyticsService.updateFastestTimeForWord(answer, timeInMinutes, () => { });
                                        }
                                    });
                                } else {
                                    AnalyticsService.addNewWord(answer, timeInMinutes, () => { });
                                }
                            });
                        }

                        done({ success: true, data: output });
                    } catch (e) {
                        console.log(e);
                        done({ success: false, data: `Error occurred - ${sessionId}` + e.toString() });
                    }
                }
            });
        }
    }
}

module.exports = GameEngine;