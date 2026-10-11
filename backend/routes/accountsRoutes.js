const express = require("express");
const pool = require("../config/db");

const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

// All Accounts APIs require authentication and the ACCOUNTS role
router.use(authenticateToken);
router.use(authorizeRoles("ACCOUNTS"));

// GET /api/accounts/vouchers
// View all expense vouchers
router.get("/vouchers", async (req, res) => {
    try {
        const [vouchers] = await pool.execute(`
            SELECT
                ev.id,
                ev.voucher_number,
                ev.voucher_date,
                ev.expense_date,
                ev.department,
                ev.expense_title,
                ev.expense_category,
                ev.expense_description,
                ev.amount,
                ev.employee_signature,
                ev.director_signature,
                ev.status,
                ev.approval_date,
                ev.rejection_reason,
                ev.created_at,
                ev.updated_at,
                u.employee_id,
                u.full_name AS employee_name,
                u.email AS employee_email
            FROM expense_vouchers ev
            JOIN users u
                ON ev.employee_user_id = u.id
            ORDER BY ev.created_at DESC
        `);

        return res.status(200).json({
            success: true,
            count: vouchers.length,
            vouchers
        });

    } catch (error) {
        console.error("Accounts fetch error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve expense vouchers."
        });
    }
});

// GET /api/accounts/vouchers/:id
// View a specific voucher
router.get("/vouchers/:id", async (req, res) => {
    try {
        const voucherId = Number(req.params.id);

        if (!Number.isInteger(voucherId) || voucherId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid voucher ID."
            });
        }

        const [vouchers] = await pool.execute(
            `SELECT
                ev.*,
                u.employee_id,
                u.full_name AS employee_name,
                u.email AS employee_email
             FROM expense_vouchers ev
             JOIN users u
                ON ev.employee_user_id = u.id
             WHERE ev.id = ?`,
            [voucherId]
        );

        if (vouchers.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Voucher not found."
            });
        }

        return res.status(200).json({
            success: true,
            voucher: vouchers[0]
        });

    } catch (error) {
        console.error("Accounts voucher error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve the voucher."
        });
    }
});

// GET /api/accounts/summary
// View voucher counts by status
router.get("/summary", async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT
                COUNT(*) AS total_vouchers,
                SUM(status = 'DRAFT') AS draft_vouchers,
                SUM(status = 'PENDING_APPROVAL') AS pending_vouchers,
                SUM(status = 'APPROVED') AS approved_vouchers,
                SUM(status = 'REJECTED') AS rejected_vouchers
            FROM expense_vouchers
        `);

        const summary = rows[0];

        return res.status(200).json({
            success: true,
            summary: {
                total_vouchers: Number(summary.total_vouchers || 0),
                draft_vouchers: Number(summary.draft_vouchers || 0),
                pending_vouchers: Number(summary.pending_vouchers || 0),
                approved_vouchers: Number(summary.approved_vouchers || 0),
                rejected_vouchers: Number(summary.rejected_vouchers || 0)
            }
        });

    } catch (error) {
        console.error("Accounts summary error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve voucher summary."
        });
    }
});

module.exports = router;