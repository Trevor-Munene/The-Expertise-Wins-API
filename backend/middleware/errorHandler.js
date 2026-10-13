// errorHandler.js

const errorHandler = (error, req, res, next) => {
    console.error(error);

    const statusCode = error.status || error.statusCode || 500;
    const message = statusCode >= 500 ? "Internal server error." : error.message || "Request failed.";
    res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;
