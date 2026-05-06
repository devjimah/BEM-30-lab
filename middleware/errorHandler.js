const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const isProduction = process.env.NODE_ENV === 'production';

    const message =
        statusCode === 500 && isProduction
            ? 'Internal Server Error'
            : (err.message || 'Internal Server Error');

    console.error(`[ERROR ${statusCode}] ${err.message}`);
    if (!isProduction && err.stack) {
        console.error(err.stack);
    }

    res.status(statusCode).json({
        success: false,
        error: message
    });
};

module.exports = errorHandler;
