require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

// Routes
app.post('/api/auth/validate', (req, res) => {
    const { initData } = req.body;
    // Telegram validation logic
});

app.listen(8000, () => console.log('Backend running on port 8000'));