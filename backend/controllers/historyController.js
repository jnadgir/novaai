const History = require('../models/History');

const saveHistory = async (req, res) => {
  try {
    const { prompt, response } = req.body;

    if (!prompt || !response) {
      return res.status(400).json({ message: 'Prompt and response are required' });
    }

    const entry = await History.create({
      user: req.userId,
      prompt,
      response,
    });

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getHistory = async (req, res) => {
  try {
    const history = await History.find({ user: req.userId }).sort({ createdAt: -1 });
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteHistory = async (req, res) => {
  try {
    await History.deleteMany({ user: req.userId });
    res.status(200).json({ message: 'History cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { saveHistory, getHistory, deleteHistory };