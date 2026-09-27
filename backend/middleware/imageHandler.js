// middleware/imageHandler.js

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directories exist
const ensureDirectory = (directory) => {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true, });
    }
};

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        const type = req.baseUrl.includes("editor")
            ? "posts"
            : "avatars";

        const uploadPath = path.join(
            __dirname,
            "..",
            "uploads",
            type
        );

        ensureDirectory(uploadPath);

        callback(null, uploadPath);
    },

    filename: (req, file, callback) => {
        const extension = path.extname(file.originalname);

        const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;

        callback(null, filename);
    },
});

const fileFilter = (req, file, callback) => {
    const allowed = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/jpg",
    ];

    if (!allowed.includes(file.mimetype)) {
        return callback(
            new Error("Only JPEG, PNG and WebP images are allowed."),
            false
        );
    }

    callback(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024,  }, // 5MB limit
});

module.exports = upload;