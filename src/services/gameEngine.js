const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { nanoid } = require("nanoid");
class GameEngine {

    static isDemoMode = false;
    static SESSIONS_FILE_PATH = path.join(__dirname, "../", "data", "sessions.json");
    static WORDS_FILE_PATH = path.join(__dirname, "../", "data", "words.json");

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
            while(!isFound) {
                const index = Math.floor(Math.random() * dataset.length);
                word = dataset[index].word.value;
                console.log("Word is", word);
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
        const sessions = JSON.parse(fs.readFileSync(this.SESSIONS_FILE_PATH));
        if (!sessions[id]) {
            return false;
        }
        return true;
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
            const response = await axios.get("https://api.dictionaryapi.dev/api/v2/entries/en/" + word.toLowerCase());
            if (Array.isArray(response.data)) {
                return true;
            } else {
                return false;
            }
        }
    }

    static submitAnswer(sessionId, answer) {
        return this.isValidWord(answer).then(isValid => {
            if (!isValid) {
                return Promise.reject(false);
            } else {
                const output = [];
                const word = this.getWordFromSession(sessionId);
                if (word === null) {
                    return Promise.reject(false);
                }
                for (let i = 0; i < word.length; i++) {
                    const character = word[i];
                    if (character === answer[i]) {
                        output[i] = "correct";
                    } else {
                        output[i] = "absent";
                    }

                    if (output[i] !== "correct" && word.includes(answer[i])) {
                        output[i] = "present";
                    }
                }
                return Promise.resolve(Object.values(output));
            }
        });
    }
}

module.exports = GameEngine;