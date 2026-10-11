const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const voucherRoutes = require("./routes/voucherRoutes");
const directorRoutes = require("./routes/directorRoutes");
const accountsRoutes = require("./routes/accountsRoutes");

const app = express();

// Middleware
app.use(
    cors({
        origin: "http://localhost:5173"
    })
);

app.use(express.json());

// Authentication APIs
app.use("/api/auth", authRoutes);

// Expense Voucher APIs
app.use("/api/vouchers", voucherRoutes);

app.use("/api/director", directorRoutes);

app.use("/api/accounts", accountsRoutes);

// Home API
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Expense Voucher Management System API is running!"
    });
});

// Health Check API
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        status: "OK"
    });
});

// Database Connection Test API
app.get("/api/db-test", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT DATABASE() AS databaseName"
        );

        res.status(200).json({
            success: true,
            message: "MySQL connected successfully!",
            database: rows[0].databaseName
        });
    } catch (error) {
        console.error(
            "Database connection failed:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Database connection failed"
        });
    }
});

// Handle Invalid Routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found."
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Server error:", err.message);

    res.status(500).json({
        success: false,
        message: "An internal server error occurred."
    });
});

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(
        `Server running at http://localhost:${PORT}`
    );
});