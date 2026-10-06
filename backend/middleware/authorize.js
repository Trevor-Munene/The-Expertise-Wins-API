// authorizeAdmin.js

const authorizeAdmin = (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: "Authentication required.", });
    if (req.user.status !== "ACTIVE") return res.status(403).json({ success: false, message: "Active account required.", });
    if (req.user.role !== "ADMIN") return res.status(403).json({ success: false, message: "Admin access required.", });
    next();
};

module.exports = authorizeAdmin;