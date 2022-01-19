const fs = require("fs");
const path = require("path");
const { nanoid } = require("nanoid");
class GameEngine {

    static isDemoMode = false;
    static SESSIONS_FILE_PATH = path.join(__dirname, "../../", "sessions.json");
    static WORDS_FILE_PATH = path.join(__dirname, "../", "data", "words.json");
    static WORDS_DICTIONARY_FILE_PATH = path.join(__dirname, "../", "data", "words_dictionary.json");

    static generateRandomId() {
        return nanoid();
    }

    static getRandomWord() {
        if (this.isDemoMode) {
            return this.createNewSession("CACTUS");
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

            return this.createNewSession(word);
        }
    }

    static clearSession(sessionId) {
        const sessions = JSON.parse(fs.readFileSync(this.SESSIONS_FILE_PATH));
        delete sessions[sessionId];
        fs.writeFileSync(this.SESSIONS_FILE_PATH, JSON.stringify({}, null, 4));
    }

    static clearAllSessions() {
        fs.writeFileSync(this.SESSIONS_FILE_PATH, JSON.stringify({}, null, 4));
    }

    static isSessionValid(id) {
        try {
            const sessions = JSON.parse(fs.readFileSync(this.SESSIONS_FILE_PATH));
            if (!sessions[id]) {
                return false;
            }
            return true;
        } catch {
            console.error("Invalid Session", id);
        }
    }

    static createNewSession(word) {
        const id = this.generateRandomId();
        const sessions = JSON.parse(fs.readFileSync(this.SESSIONS_FILE_PATH));
        if (!sessions[id]) {
            sessions[id] = word.toUpperCase();
        }
        fs.writeFileSync(this.SESSIONS_FILE_PATH, JSON.stringify(sessions, null, 4));
        return {
            id: id,
            length: word.length
        };
    }

    static getWordFromSession(sessionId) {
        const sessions = JSON.parse(fs.readFileSync(this.SESSIONS_FILE_PATH));
        if (sessions[sessionId]) {
            return sessions[sessionId].toUpperCase();
        } else {
            return null;
        }
    }

    static async isValidWord(word) {
        if (this.isDemoMode) {
            return Promise.resolve(true);
        } else {
            const dictionary = JSON.parse(fs.readFileSync(this.WORDS_DICTIONARY_FILE_PATH));
            if (dictionary[word.toLowerCase()]) {
                return true;
            } else {
                return false;
            }
        }
    }

    static getCharCountInString(word, character) {
        const letters = word.split("");
        const count = letters.reduce((sum, l) => {
            if (l.toLowerCase() === character.toLowerCase()) {
                sum = sum + 1;
            }
            return sum;
        }, 0);
        return count;
    }

    static submitAnswer(sessionId, answer) {
        if (!this.isSessionValid(sessionId)) {
            return Promise.reject("Invalid Session");
        }
        return this.isValidWord(answer).then(isValid => {
            if (!isValid) {
                return Promise.reject("Invalid Word");
            } else {
                const output = [];
                const word = this.getWordFromSession(sessionId);
                for (let i = 0; i < word.length; i++) {
                    const character = word[i];
                    if (character === answer[i]) {
                        output[i] = "correct";
                    } else {
                        output[i] = "absent";
                    }

                    if (output[i] !== "correct" && word.includes(answer[i])
                        && this.getCharCountInString(word, character) !== this.getCharCountInString(answer, character)) {
                        output[i] = "present";
                    }
                }
                return Promise.resolve(output);
            }
        });
    }
}

module.exports = GameEngine;