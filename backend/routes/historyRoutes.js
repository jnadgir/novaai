const express = require('express');
const router = express.Router();
const { saveHistory, getHistory, deleteHistory } = require('../controllers/historyController');
const protect = require('../middleware/auth');

router.post('/', protect, saveHistory);
router.get('/', protect, getHistory);
router.delete('/', protect, deleteHistory);

module.exports = router;