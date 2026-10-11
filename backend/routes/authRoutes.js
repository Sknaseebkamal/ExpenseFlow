
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const router = express.Router();

// ============================================
// EMPLOYEE REGISTRATION
// POST /api/auth/register
// ============================================

router.post("/register", async (req, res) => {
    try {
        const {
            employee_id,
            full_name,
            email,
            password,
            department
        } = req.body;

        if (
            typeof full_name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Full name, email, and password are required."
            });
        }

        const cleanName = full_name.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (!cleanName || !cleanEmail) {
            return res.status(400).json({
                success: false,
                message: "Name and email cannot be empty."
            });
        }

        if (password.length < 8 || password.length > 72) {
            return res.status(400).json({
                success: false,
                message: "Password must be between 8 and 72 characters."
            });
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }

        const [existingUsers] = await pool.execute(
            "SELECT id FROM users WHERE email = ?",
            [cleanEmail]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Public registration can create EMPLOYEE accounts only.
        const [result] = await pool.execute(
            `INSERT INTO users
                (employee_id, full_name, email, password, role, department)
             VALUES (?, ?, ?, ?, 'EMPLOYEE', ?)`,
            [
                employee_id || null,
                cleanName,
                cleanEmail,
                hashedPassword,
                department || null
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Employee registered successfully.",
            user: {
                id: result.insertId,
                employee_id: employee_id || null,
                full_name: cleanName,
                email: cleanEmail,
                role: "EMPLOYEE",
                department: department || null
            }
        });

    } catch (error) {
        console.error("Registration error:", error.message);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Email or employee ID already exists."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Registration failed."
        });
    }
});

// ============================================
// USER LOGIN
// POST /api/auth/login
// ============================================

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const [users] = await pool.execute(
            `SELECT
                id,
                employee_id,
                full_name,
                email,
                password,
                role,
                department
             FROM users
             WHERE email = ?`,
            [cleanEmail]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const user = users[0];

        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing from .env");

            return res.status(500).json({
                success: false,
                message: "Server authentication configuration error."
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "8h"
            }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            user: {
                id: user.id,
                employee_id: user.employee_id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                department: user.department
            }
        });

    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Login failed."
        });
    }
});

module.exports = router;
