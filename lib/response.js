const sendSuccess = (res, code, message, data, extra = {}) => {
    return res.status(code).json({ 
        code, 
        status: 'success', 
        message, data, 
        ...extra 
    });
};

const sendError = (res, code, message) => {
    return res.status(code).json({ 
        code, 
        status: 'failure', 
        message });
};
module.exports = { sendSuccess, sendError };