require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require("cors");
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const app = express();
app.use(cors({
    exposedHeaders: ['Content-Range']
}));
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

app.post("/api/users", async (req, res) => {
    const { telegramId, firstName, lastName, username, linkHash } = req.body;

    try {
        // Check if user exists
        let user = await User.findOne({ telegramId });

        if (!user) {
            // Create new user
            user = new User({
                telegramId,
                firstName,
                lastName,
                username,
            });
            await user.save();

            // // Update referrer's referrals array if referral exists
            // if (linkHash) {
            //     const shareLink = await ShareLink.findOne({
            //         hash: linkHash,
            //     });

            //     if (shareLink) {
            //         await User.findByIdAndUpdate(shareLink.userId, {
            //             $push: {
            //                 referrals: {
            //                     userId: user._id,
            //                     createdAt: new Date()
            //                 }
            //             }
            //         });
            //     }
            // }
        }

        res.json(user);
    } catch (error) {
        console.error("Error in /users:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(8000, () => console.log('Backend running on port 8000'));