const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

function isValidEmail(email) {
    if (typeof email !== "string") return false;
    const value = email.trim();
    const parts = value.split("@");

    if (parts.length !== 2) return false;

    const [local, domain] = parts;
    if (!local || local.length > 64 || local.startsWith(".") ||
        local.endsWith(".") || local.includes("..")) return false;

    if (!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)) return false;

    const labels = domain.split(".");
    if (labels.length < 2) return false;

    if (labels.some(label => !label || label.length > 63 ||
        label.startsWith("-") || label.endsWith("-") ||
        !/^[A-Za-z0-9-]+$/.test(label))) return false;

    return /^[A-Za-z]{2,}$/.test(labels[labels.length - 1]);
}

function isValidPhone(phone) {
    return typeof phone === "string" && /^\+?[0-9]{7,15}$/.test(phone.trim());
}

function validDate(value) {
    const date = new Date(value);
    return value && !Number.isNaN(date.getTime()) && date <= new Date();
}

// Register a new account.
router.post("/register", async (req, res) => {
    try {
        const { username, email, password, phone, dob } = req.body;

        if (![username, email, password, phone, dob].every(Boolean)) {
            return res.status(400).json({ message: "Please complete all fields." });
        }
        if (username.trim().length < 3 || username.trim().length > 30) {
            return res.status(400).json({ message: "Username must be 3 to 30 characters." });
        }
        if (password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters." });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({ message: "Please enter a valid email address." });
        }
        if (!isValidPhone(phone)) {
            return res.status(400).json({ message: "Phone number must contain 7 to 15 digits, with an optional +." });
        }
        if (!validDate(dob)) {
            return res.status(400).json({ message: "Please enter a valid date of birth that is not in the future." });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await User.findOne({
            $or: [{ email: normalizedEmail }, { username: username.trim() }]
        });

        if (existingUser) {
            return res.status(409).json({ message: "That email address or username is already registered." });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await User.create({
            username: username.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            phone: phone.trim(),
            dob: new Date(dob)
        });

        return res.status(201).json({ message: "Registration successful. You can now log in." });
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({ message: "Unable to register right now. Please try again." });
    }
});

// Log in with email and password.
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Enter your email address and password." });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({ message: "Please enter a valid email address." });
        }

        const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
        if (!user) {
            return res.status(401).json({ message: "Incorrect email address or password." });
        }

        const passwordMatches = await bcrypt.compare(password, user.password);
        if (!passwordMatches) {
            return res.status(401).json({ message: "Incorrect email address or password." });
        }

        const token = jwt.sign(
            { userId: user._id.toString() },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.json({ message: "Login successful.", token });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Unable to log in right now. Please try again." });
    }
});

module.exports = router;
