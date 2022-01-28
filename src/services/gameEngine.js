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
        returnObj.bestTime = stats["best_time"];
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
  return timeElapsedInSeconds > 15 * 60;
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
            bestTime: stats["best_time"],
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

const getLetterCountDistributionMapForWord = (word) => {
  if (!word || !word.length) {
    return;
  }
  const distributionMap = {};
  word
    .toUpperCase()
    .split("")
    .forEach((letter) => {
      if (!distributionMap[letter]) {
        distributionMap[letter] = 1;
      } else {
        distributionMap[letter] = distributionMap[letter] + 1;
      }
    });
  return distributionMap;
};

const generateColorMap = (userInput, solution) => {
  userInput = userInput.toUpperCase();
  solution = solution.toUpperCase();
  const userInputMap = getLetterCountDistributionMapForWord(userInput);
  const solutionMap = getLetterCountDistributionMapForWord(solution);
  const colorMap = Array.from({ length: userInput.length }, () => "");
  userInput.split("").forEach((inputLetter, index) => {
    if (inputLetter === solution[index]) {
      colorMap[index] = "correct";
      userInputMap[inputLetter] = userInputMap[inputLetter] - 1;
      solutionMap[inputLetter] = solutionMap[inputLetter] - 1;
    } else {
      colorMap[index] = "absent";
    }
  });
  return colorMap.map((code, index) => {
    const inputLetter = userInput[index];
    if (code !== "absent") {
      return code;
    } else if (
      userInputMap[inputLetter] &&
      solutionMap[inputLetter] &&
      userInputMap[inputLetter] !== 0 &&
      solutionMap[inputLetter] !== 0 &&
      Math.abs(userInputMap[inputLetter] - solutionMap[inputLetter]) >= 0
    ) {
      userInputMap[inputLetter] = userInputMap[inputLetter] - 1;
      solutionMap[inputLetter] = solutionMap[inputLetter] - 1;
      return "present";
    }
    return code;
  });
};

const submitWord = (req, res) => {
  try {
    const userInput = req.body.word;
    const sessionId = req.body.sessionId;

    if (!isValidWord(userInput) || userInput === "") {
      logger.error(`Word not found in dictionary - ${sessionId}`, userInput);
      res.status(404).json({ success: false, message: "invalid word" });
    } else {
      SessionsService.getSessionDetails(sessionId, (session) => {
        if (session === null) {
          logger.error("Invalid Session", sessionId);
          res.status(404).json({ success: false, message: "invalid session" });
        } else if (hasSessionExpired(session["start_time"])) {
          res.status(404).json({ success: false, message: "session expired" });
        } else {
          // const output = [];
          // for (let i = 0; i < session.word.length; i++) {
          //   const character = session.word[i];
          //   if (character.toLowerCase() === userInput[i].toLowerCase()) {
          //     output[i] = "correct";
          //   } else {
          //     output[i] = "absent";
          //   }
          //   if (
          //     output[i] !== "correct" &&
          //     session.word.toLowerCase().includes(userInput[i].toLowerCase())
          //   ) {
          //     output[i] = "present";
          //   }
          // }
          const output = generateColorMap(userInput, session.word);

          if (isGameComplete(output)) {
            SessionsService.endSession(sessionId, (endTime) => {
              AnalyticsService.getStatsForWord(
                session.word.toUpperCase(),
                (stats) => {
                  const gameDurationInMinutes =
                    (+endTime - +session["start_time"]) / (1000 * 60);
                  if (stats !== null) {
                    let totalTime = +stats.count * stats["avg_time"];
                    const avgTime =
                      (totalTime + gameDurationInMinutes) / (+stats.count + 1);
                    if (
                      gameDurationInMinutes < +stats["best_time"] &&
                      gameDurationInMinutes * 60 > 10
                    ) {
                      AnalyticsService.updateForWord(
                        session.word,
                        +stats.count + 1,
                        gameDurationInMinutes,
                        avgTime
                      );
                    } else {
                      AnalyticsService.updateForWord(
                        session.word,
                        +stats.count + 1,
                        +stats["best_time"],
                        avgTime
                      );
                    }
                  } else {
                    AnalyticsService.addNewWord(
                      session.word,
                      gameDurationInMinutes
                    );
                  }
                  res.json({
                    success: true,
                    data: output,
                    duration: gameDurationInMinutes,
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
          totalHits: stats !== null ? +stats.count : null,
          bestTime: stats !== null ? +stats["best_time"] : null,
          avgTime: stats !== null ? +stats["avg_time"] : null,
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
