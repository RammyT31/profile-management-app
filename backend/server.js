require("dotenv").config();

const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");

const app = express();
app.use(cors({
    origin: "http://127.0.0.1:5501"
}));
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the frontend from frontend/public.
app.use(express.static(path.join(__dirname, "../frontend/public")));

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);

// Return JSON for unknown API routes instead of an HTML 404 page.
app.use("/api", (req, res) => {
    res.status(404).json({ message: "API endpoint not found." });
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/public/index.html"));
});

async function startServer() {
    if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
        console.error("Missing MONGODB_URI or JWT_SECRET in backend/.env");
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB successfully.");

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
}

startServer();