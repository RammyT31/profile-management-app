const express = require("express");
const User = require("../models/User");
const authenticateToken = require("../middleware/authenticateToken");

const router = express.Router();

function isValidEmail(email) {
    if (typeof email !== "string") return false;
    const parts = email.trim().split("@");
    if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
    const labels = parts[1].split(".");
    return labels.length >= 2 &&
        /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(parts[0]) &&
        labels.every(label => /^[A-Za-z0-9-]+$/.test(label) && label.length > 0) &&
        /^[A-Za-z]{2,}$/.test(labels[labels.length - 1]);
}

function isValidPhone(phone) {
    return typeof phone === "string" && /^\+?[0-9]{7,15}$/.test(phone.trim());
}

function validDate(value) {
    const date = new Date(value);
    return value && !Number.isNaN(date.getTime()) && date <= new Date();
}

function profileResponse(user) {
    return {
        username: user.username,
        email: user.email,
        phone: user.phone,
        dob: user.dob ? user.dob.toISOString().slice(0, 10) : ""
    };
}

// Get the logged-in user's profile.
router.get("/", authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: "User profile not found." });
        res.json({ profile: profileResponse(user) });
    } catch (error) {
        console.error("Profile fetch error:", error);
        res.status(500).json({ message: "Unable to load your profile." });
    }
});

// Update the logged-in user's profile.
router.put("/", authenticateToken, async (req, res) => {
    try {
        const { username, email, phone, dob } = req.body;

        if (![username, email, phone, dob].every(Boolean)) {
            return res.status(400).json({ message: "Please complete all profile fields." });
        }
        if (username.trim().length < 3 || username.trim().length > 30) {
            return res.status(400).json({ message: "Username must be 3 to 30 characters." });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({ message: "Please enter a valid email address." });
        }
        if (!isValidPhone(phone)) {
            return res.status(400).json({ message: "Phone number must contain 7 to 15 digits, with an optional +." });
        }
        if (!validDate(dob)) {
            return res.status(400).json({ message: "Please enter a valid date of birth." });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const duplicateEmail = await User.findOne({
            email: normalizedEmail,
            _id: { $ne: req.userId }
        });
        if (duplicateEmail) {
            return res.status(409).json({ message: "That email address is already used by another account." });
        }

        const user = await User.findByIdAndUpdate(
            req.userId,
            {
                username: username.trim(),
                email: normalizedEmail,
                phone: phone.trim(),
                dob: new Date(dob)
            },
            { new: true, runValidators: true }
        );

        if (!user) return res.status(404).json({ message: "User profile not found." });
        res.json({ message: "Profile updated successfully.", profile: profileResponse(user) });
    } catch (error) {
        console.error("Profile update error:", error);
        res.status(500).json({ message: "Unable to update your profile." });
    }
});

module.exports = router;
