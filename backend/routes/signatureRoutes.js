const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const multer = require("multer");
const pool = require("../config/db");

const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();
const signatureDirectory = path.join(__dirname, "..", "uploads", "signatures");
const imageExtensions = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp"
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2 * 1024 * 1024
    },
    fileFilter: (req, file, callback) => {
        if (!imageExtensions[file.mimetype]) {
            callback(new Error("Upload a PNG, JPG, or WebP image."));
            return;
        }

        callback(null, true);
    }
});

function hasValidImageHeader(file) {
    if (file.mimetype === "image/png") {
        return file.buffer.subarray(0, 8).equals(
            Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
        );
    }

    if (file.mimetype === "image/jpeg") {
        return file.buffer[0] === 0xff &&
            file.buffer[1] === 0xd8 &&
            file.buffer[2] === 0xff;
    }

    return file.mimetype === "image/webp" &&
        file.buffer.toString("ascii", 0, 4) === "RIFF" &&
        file.buffer.toString("ascii", 8, 12) === "WEBP";
}

router.post(
    "/",
    authenticateToken,
    authorizeRoles("EMPLOYEE"),
    (req, res, next) => {
        upload.single("signature")(req, res, (error) => {
            if (error) {
                const status = error instanceof multer.MulterError &&
                    error.code === "LIMIT_FILE_SIZE"
                    ? 413
                    : 400;

                return res.status(status).json({
                    success: false,
                    message: error.message
                });
            }

            next();
        });
    },
    async (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Choose a signature image to upload."
            });
        }

        if (!hasValidImageHeader(req.file)) {
            return res.status(400).json({
                success: false,
                message: "The uploaded file is not a valid PNG, JPG, or WebP image."
            });
        }

        const filename = `${crypto.randomUUID()}${imageExtensions[req.file.mimetype]}`;
        const filePath = path.join(signatureDirectory, filename);

        try {
            await fs.promises.mkdir(signatureDirectory, { recursive: true });
            await fs.promises.writeFile(filePath, req.file.buffer, { flag: "wx" });

            return res.status(201).json({
                success: true,
                signature: `/signatures/${filename}`
            });
        } catch (error) {
            console.error("Signature upload error:", error.message);

            return res.status(500).json({
                success: false,
                message: "Failed to save the signature image."
            });
        }
    }
);

router.get(
    "/:filename",
    authenticateToken,
    authorizeRoles("EMPLOYEE", "DIRECTOR", "ACCOUNTS"),
    async (req, res) => {
        const { filename } = req.params;

        if (!/^[0-9a-f-]{36}\.(png|jpg|webp)$/.test(filename)) {
            return res.status(400).json({
                success: false,
                message: "Invalid signature image."
            });
        }

        try {
            const signaturePath = `/signatures/${filename}`;
            const query = req.user.role === "EMPLOYEE"
                ? `SELECT id
                   FROM expense_vouchers
                   WHERE employee_signature = ?
                     AND employee_user_id = ?
                   LIMIT 1`
                : `SELECT id
                   FROM expense_vouchers
                   WHERE employee_signature = ?
                   LIMIT 1`;
            const parameters = req.user.role === "EMPLOYEE"
                ? [signaturePath, req.user.id]
                : [signaturePath];
            const [vouchers] = await pool.execute(query, parameters);

            if (vouchers.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Signature image not found."
                });
            }

            res.set("Cache-Control", "private, no-store");

            return res.sendFile(
                path.join(signatureDirectory, filename),
                (error) => {
                    if (error && !res.headersSent) {
                        console.error("Signature image read error:", error.message);
                        res.status(404).json({
                            success: false,
                            message: "Signature image not found."
                        });
                    }
                }
            );
        } catch (error) {
            console.error("Signature lookup error:", error.message);

            return res.status(500).json({
                success: false,
                message: "Failed to retrieve the signature image."
            });
        }
    }
);

module.exports = router;
