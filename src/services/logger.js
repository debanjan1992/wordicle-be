const log4js = require("log4js");

log4js.configure({
    appenders: {
        error: { type: "file", filename: "info.log" },
        info: { type: "file", filename: "error.log" },
    },
    categories: {
        default: { appenders: ["error"], level: "error" },
        info: { appenders: ["info"], level: "info" },
    }
});

const loggerError = log4js.getLogger();
const loggerInfo = log4js.getLogger("info");

module.exports = {
    error: (message, args) => loggerError.error(message, args),
    info: (message, args) => loggerInfo.info(message, args),
};