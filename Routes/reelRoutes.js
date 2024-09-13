const express = require('express');
const router = express.Router();
const { authenticateSession, } = require('../App/Middleware/authenticationMiddleWare');
const {
    createReel,
    getReels,
    getUserReels,
    updateLike,
    deleteReel,
} = require("../App/Controller/ReelController");

router.post('/createReel', authenticateSession, createReel);
router.get('/getReels', authenticateSession, getReels);
router.get('/getUserReels/:userId', authenticateSession, getUserReels);
router.put('/updateLike/:reelId', authenticateSession, updateLike);
router.delete('/deleteReel/:reelId', authenticateSession, deleteReel);

module.exports = router;