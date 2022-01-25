const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const SessionsService = require("./sessionsService");
const AnalyticsService = require("./analyticsService");
const logger = require("./logger");
dotenv.config();

const dictionary = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../", "data", "words_dictionary.json"))
);
const isDemoMode = process.env.DEMO_MODE === "true";
const DEMO_WORD = process.env.DEMO_WORD;
const wordsDB = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../", "data", "words.json"))
);

const startNewGame = (req, res) => {
  const minWordLength = process.env.MIN_WORD_LENGTH || 4;
  const maxWordLength = process.env.MAX_WORD_LENGTH || 7;
  let word = getRandomWord(+minWordLength, +maxWordLength);
  SessionsService.createNewSession(word, (sessionId, startTime, wordLength) => {
    AnalyticsService.getStatsForWord(word, (stats) => {
      const returnObj = {
        id: sessionId,
        startTime,
        length: wordLength,
      };
      if (stats !== null) {
        returnObj.bestTime = stats.time;
        returnObj.counter = stats.counter;
      }
      res.json(returnObj);
    });
  });
};

const getRandomWord = (minLength, maxLength) => {
  if (isDemoMode) {
    return DEMO_WORD;
  } else {
    let isFound = false;
    let word;
    while (!isFound) {
      const index = Math.floor(Math.random() * wordsDB.length);
      word = wordsDB[index].word.value;
      if (word.length >= minLength && word.length <= maxLength) {
        isFound = true;
      }
    }
    return word;
  }
};

const hasSessionExpired = (sessionStartTime) => {
  const timeElapsedInSeconds = (new Date().getTime() - sessionStartTime) / 1000;
  return timeElapsedInSeconds > (60 * 15);
};

const getSessionDetails = (req, res) => {
  const sessionId = req.query.id;
  SessionsService.getSessionDetails(sessionId, (data) => {
    if (data === null) {
      res.status(404).json({ valid: false, message: "invalid session" });
    } else if (hasSessionExpired(+data["start_time"])) {
      res.status(404).json({ valid: false, message: "session expired" });
    } else {
      AnalyticsService.getStatsForWord(data.word, (stats) => {
        if (stats !== null) {
          res.json({
            valid: true,
            length: data.word.length,
            startTime: data["start_time"],
            bestTime: stats.time,
          });
        } else {
          res.json({
            valid: true,
            length: data.word.length,
            startTime: data["start_time"],
          });
        }
      });
    }
  });
};

const isValidWord = (word) => {
  if (isDemoMode) {
    return true;
  } else {
    if (dictionary[word.toLowerCase()]) {
      return true;
    } else {
      return false;
    }
  }
};

const isGameComplete = (mapping) => {
  return (
    mapping.reduce((acc, code) => {
      if (code === "correct") {
        acc = acc + 1;
      }
      return acc;
    }, 0) === mapping.length
  );
};

const submitWord = (req, res) => {
  try {
    const userInput = req.body.word;
    const sessionId = req.body.sessionId;

    if (!isValidWord(userInput) || userInput === "") {
      logger.error(`Word not found in dictionary - ${sessionId}`, userInput);
      res.status(404).json({ success: false, message: "Invalid word!" });
    } else {
      SessionsService.getSessionDetails(sessionId, (session) => {
        if (session === null) {
          logger.error("Invalid Session", sessionId);
          res.status(404).json({ success: false, message: "invalid Session" });
        } else if (hasSessionExpired(session["start_time"])) {
          res.status(404).json({ success: false, message: "session expired" });
        } else {
          const output = [];
          for (let i = 0; i < session.word.length; i++) {
            const character = session.word[i];
            if (character.toLowerCase() === userInput[i].toLowerCase()) {
              output[i] = "correct";
            } else {
              output[i] = "absent";
            }
            if (
              output[i] !== "correct" &&
              session.word.toLowerCase().includes(userInput[i].toLowerCase())
            ) {
              output[i] = "present";
            }
          }

          if (isGameComplete(output)) {
            SessionsService.endSession(sessionId, (endTime) => {
              AnalyticsService.getStatsForWord(
                session.word.toUpperCase(),
                (stats) => {
                  const timeInMinutes =
                    (+endTime - +session["start_time"]) / (1000 * 60);
                  if (stats !== null) {
                    AnalyticsService.addCountForWord(session.word, () => {
                      if (
                        timeInMinutes < +stats.time &&
                        timeInMinutes * 60 > 10
                      ) {
                        AnalyticsService.updateFastestTimeForWord(
                          session.word,
                          timeInMinutes
                        );
                      }
                    });
                  } else {
                    AnalyticsService.addNewWord(session.word, timeInMinutes);
                  }
                  res.json({
                    success: true,
                    data: output,
                    duration: timeInMinutes,
                    gameOver: true,
                  });
                }
              );
            });
          } else {
            res.json({ success: true, data: output, gameOver: false });
          }
        }
      });
    }
  } catch (e) {
    logger.error("Failed during submit word", e);
  }
};

const revealWord = (req, res) => {
  const sessionId = req.query.sessionId;
  SessionsService.endSession(sessionId);
  SessionsService.getSessionDetails(sessionId, (data) => {
    AnalyticsService.getStatsForWord(data.word, (stats) => {
      res.json({
        success: true,
        data: data.word,
        stats: {
          totalHits: stats !== null ? stats.count : null,
          bestTime: stats !== null ? stats.time : null,
        },
      });
    });
  });
};

module.exports = {
  startNewGame,
  getSessionDetails,
  submitWord,
  revealWord,
};
