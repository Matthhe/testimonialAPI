const { sendError } = require("./response");

const handleError = (err, res) => {
  if (err.name === "ValidationError") {
    return sendError(res, 400, err.message);
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return sendError(res, 400, `Duplicate value for ${field}`);
  }
  return sendError(res, 500, "Internal server error");
};

module.exports = { handleError };