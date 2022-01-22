const express = require('express');
const SessionsService = require("./services/sessionsService");
const path = require("path");
const router = express.Router();

router.get("/logs", (req, res) => {
    const LOG_FILE_PATH = path.join(__dirname, "../", "info.log");
    res.sendFile(LOG_FILE_PATH);
});

router.get("/sessions", (req, res) => {
    SessionsService.getAllSessionDetails(results => {
        res.json({ sessions: results.length });
    });
});

router.get("/cleanSessions", (req, res) => {
    SessionsService.getAllSessionDetails(sessions => {
        const currentTimeStamp = new Date().getTime();
        const sessionsToBeDeleted = [];
        sessions.forEach(session => {
            const diffInDays = Math.floor((currentTimeStamp - +session["start_time"]) / (1000 * 60 * 60 * 24));
            if (diffInDays > 0) {
                sessionsToBeDeleted.push(session.id);
            }
        });
        if (sessionsToBeDeleted.length) {
            SessionsService.deleteSessions(sessionsToBeDeleted, () => res.json({ success: true, data: sessionsToBeDeleted }));
        } else {
            res.json({ success: false, message: "No sessions to be deleted" })
        }
    });
});

module.exports = router;