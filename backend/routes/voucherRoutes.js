const express = require("express");
const pool = require("../config/db");

const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

// All voucher routes require an authenticated Employee
router.use(authenticateToken);
router.use(authorizeRoles("EMPLOYEE"));

// Generate a unique voucher number
function generateVoucherNumber() {
    const timestamp = Date.now();
    const random = Math.floor(1000 + Math.random() * 9000);

    return `EXP-${timestamp}-${random}`;
}

// Validate voucher data
function validateVoucher(data) {
    const {
        voucher_date,
        expense_date,
        department,
        expense_title,
        amount
    } = data;  

    if (
        !voucher_date ||
        !expense_date ||
        !department ||
        !expense_title ||
        amount === undefined ||
        amount === null ||
        amount === ""
    ) {
        return "Voucher date, expense date, department, title, and amount are required.";
    }

    if (
        typeof department !== "string" ||
        typeof expense_title !== "string" ||
        !department.trim() ||
        !expense_title.trim()
    ) {
        return "Department and expense title must be valid text.";
    }

    if (
        !Number.isFinite(Number(amount)) ||
        Number(amount) <= 0
    ) {
        return "Amount must be a number greater than zero.";
    }

    return null;
}

// =============================================
// 1. CREATE A DRAFT VOUCHER
// POST /api/vouchers
// =============================================

router.post("/", async (req, res) => {
    try {
        const validationError = validateVoucher(req.body);

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        const {
            voucher_date,
            expense_date,
            department,
            expense_title,
            expense_category,
            expense_description,
            amount,
            employee_signature
        } = req.body;

        const voucherNumber = generateVoucherNumber();

        const [result] = await pool.execute(
            `INSERT INTO expense_vouchers (
                voucher_number,
                employee_user_id,
                voucher_date,
                expense_date,
                department,
                expense_title,
                expense_category,
                expense_description,
                amount,
                employee_signature,
                status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT')`,
            [
                voucherNumber,
                req.user.id,
                voucher_date,
                expense_date,
                department.trim(),
                expense_title.trim(),
                expense_category || null,
                expense_description || null,
                Number(amount),
                employee_signature || null
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Voucher draft created successfully.",
            voucher: {
                id: result.insertId,
                voucher_number: voucherNumber,
                status: "DRAFT"
            }
        });

    } catch (error) {
        console.error("Create voucher error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to create voucher draft."
        });
    }
});

// =============================================
// 2. VIEW MY VOUCHERS
// GET /api/vouchers/my
// =============================================

router.get("/my", async (req, res) => {
    try {
        const [vouchers] = await pool.execute(
            `SELECT *
             FROM expense_vouchers
             WHERE employee_user_id = ?
             ORDER BY created_at DESC`,
            [req.user.id]
        );

        return res.json({
            success: true,
            count: vouchers.length,
            vouchers
        });

    } catch (error) {
        console.error("Fetch vouchers error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch vouchers."
        });
    }
});

// =============================================
// 3. VIEW ONE OF MY VOUCHERS
// GET /api/vouchers/:id
// =============================================

router.get("/:id", async (req, res) => {
    try {
        const voucherId = Number(req.params.id);

        if (!Number.isInteger(voucherId) || voucherId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid voucher ID."
            });
        }

        const [vouchers] = await pool.execute(
            `SELECT *
             FROM expense_vouchers
             WHERE id = ? AND employee_user_id = ?`,
            [voucherId, req.user.id]
        );

        if (vouchers.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Voucher not found."
            });
        }

        return res.json({
            success: true,
            voucher: vouchers[0]
        });

    } catch (error) {
        console.error("Fetch voucher error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch voucher."
        });
    }
});

// =============================================
// 4. UPDATE A DRAFT VOUCHER
// PUT /api/vouchers/:id
// =============================================

router.put("/:id", async (req, res) => {
    try {
        const voucherId = Number(req.params.id);

        if (!Number.isInteger(voucherId) || voucherId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid voucher ID."
            });
        }

        const validationError = validateVoucher(req.body);

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        const {
            voucher_date,
            expense_date,
            department,
            expense_title,
            expense_category,
            expense_description,
            amount,
            employee_signature
        } = req.body;

        const [result] = await pool.execute(
            `UPDATE expense_vouchers
             SET
                voucher_date = ?,
                expense_date = ?,
                department = ?,
                expense_title = ?,
                expense_category = ?,
                expense_description = ?,
                amount = ?,
                employee_signature = ?
             WHERE id = ?
               AND employee_user_id = ?
               AND status = 'DRAFT'`,
            [
                voucher_date,
                expense_date,
                department.trim(),
                expense_title.trim(),
                expense_category || null,
                expense_description || null,
                Number(amount),
                employee_signature || null,
                voucherId,
                req.user.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Draft voucher not found or cannot be edited."
            });
        }

        return res.json({
            success: true,
            message: "Draft voucher updated successfully."
        });

    } catch (error) {
        console.error("Update voucher error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to update voucher."
        });
    }
});

// =============================================
// 5. DELETE A DRAFT VOUCHER
// DELETE /api/vouchers/:id
// =============================================

router.delete("/:id", async (req, res) => {
    try {
        const voucherId = Number(req.params.id);

        if (!Number.isInteger(voucherId) || voucherId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid voucher ID."
            });
        }

        const [result] = await pool.execute(
            `DELETE FROM expense_vouchers
             WHERE id = ?
               AND employee_user_id = ?
               AND status = 'DRAFT'`,
            [voucherId, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Draft voucher not found or cannot be deleted."
            });
        }

        return res.json({
            success: true,
            message: "Draft voucher deleted successfully."
        });

    } catch (error) {
        console.error("Delete voucher error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to delete voucher."
        });
    }
});

// =============================================
// 6. SUBMIT A DRAFT FOR APPROVAL
// PATCH /api/vouchers/:id/submit
// =============================================

router.patch("/:id/submit", async (req, res) => {
    try {
        const voucherId = Number(req.params.id);

        if (!Number.isInteger(voucherId) || voucherId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid voucher ID."
            });
        }

        const [result] = await pool.execute(
            `UPDATE expense_vouchers
             SET status = 'PENDING_APPROVAL'
             WHERE id = ?
               AND employee_user_id = ?
               AND status = 'DRAFT'
               AND employee_signature IS NOT NULL
               AND employee_signature <> ''`,
            [voucherId, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({
                success: false,
                message: "Voucher could not be submitted. Ensure it is your draft and has an employee signature."
            });
        }

        return res.json({
            success: true,
            message: "Voucher submitted for Director approval."
        });

    } catch (error) {
        console.error("Submit voucher error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to submit voucher."
        });
    }
});

module.exports = router;