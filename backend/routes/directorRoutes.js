const express = require("express");
const pool = require("../config/db");

const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

// All Director APIs require Director access
router.use(authenticateToken);
router.use(authorizeRoles("DIRECTOR"));

// GET /api/director/vouchers
// View all vouchers
router.get("/vouchers", async (req, res) => {
    try {
        const [vouchers] = await pool.execute(`
            SELECT
                ev.*,
                u.full_name AS employee_name,
                u.email AS employee_email
            FROM expense_vouchers ev
            JOIN users u ON ev.employee_user_id = u.id
            ORDER BY ev.created_at DESC
        `);

        res.json({
            success: true,
            count: vouchers.length,
            vouchers
        });
    } catch (error) {
        console.error("Fetch vouchers error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch vouchers."
        });
    }
});

// GET /api/director/pending
// View vouchers awaiting approval
router.get("/pending", async (req, res) => {
    try {
        const [vouchers] = await pool.execute(`
            SELECT
                ev.*,
                u.full_name AS employee_name,
                u.email AS employee_email
            FROM expense_vouchers ev
            JOIN users u ON ev.employee_user_id = u.id
            WHERE ev.status = 'PENDING_APPROVAL'
            ORDER BY ev.created_at ASC
        `);

        res.json({
            success: true,
            count: vouchers.length,
            vouchers
        });
    } catch (error) {
        console.error("Fetch pending vouchers error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch pending vouchers."
        });
    }
});

// PATCH /api/director/vouchers/:id/approve
// Approve a submitted voucher
router.patch("/vouchers/:id/approve", async (req, res) => {
    try {
        const voucherId = Number(req.params.id);
        const { director_signature } = req.body;

        if (!Number.isInteger(voucherId) || voucherId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid voucher ID."
            });
        }

        if (
            typeof director_signature !== "string" ||
            !director_signature.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Director signature is required."
            });
        }

        const [result] = await pool.execute(
            `UPDATE expense_vouchers
             SET status = 'APPROVED',
                 director_signature = ?,
                 approval_date = NOW(),
                 rejection_reason = NULL
             WHERE id = ?
               AND status = 'PENDING_APPROVAL'`,
            [director_signature.trim(), voucherId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Pending voucher not found."
            });
        }

        return res.json({
            success: true,
            message: "Voucher approved successfully."
        });
    } catch (error) {
        console.error("Approve voucher error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to approve voucher."
        });
    }
});

// PATCH /api/director/vouchers/:id/reject
// Reject a submitted voucher
router.patch("/vouchers/:id/reject", async (req, res) => {
    try {
        const voucherId = Number(req.params.id);
        const { rejection_reason } = req.body;

        if (!Number.isInteger(voucherId) || voucherId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid voucher ID."
            });
        }

        if (
            typeof rejection_reason !== "string" ||
            !rejection_reason.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "A rejection reason is required."
            });
        }

        const [result] = await pool.execute(
            `UPDATE expense_vouchers
             SET status = 'REJECTED',
                 rejection_reason = ?,
                 director_signature = NULL,
                 approval_date = NULL
             WHERE id = ?
               AND status = 'PENDING_APPROVAL'`,
            [rejection_reason.trim(), voucherId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Pending voucher not found."
            });
        }

        return res.json({
            success: true,
            message: "Voucher rejected successfully."
        });
    } catch (error) {
        console.error("Reject voucher error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to reject voucher."
        });
    }
});

module.exports = router;