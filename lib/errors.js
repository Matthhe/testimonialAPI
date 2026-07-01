const { sendError } = require("./response");

const handleMongooseError = (err, res) => {
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join("; ");
    return sendError(res, 400, message);
  }
  return null;
};

const handleDuplicateKey = (err, res) => {
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return sendError(res, 400, `Duplicate value for ${field}`);
  }
  return null;
};

const handleError = (err, res) => {
  const mongooseResult = handleMongooseError(err, res);
  if (mongooseResult) return mongooseResult;

  const duplicateResult = handleDuplicateKey(err, res);
  if (duplicateResult) return duplicateResult;

  return sendError(res, 500, "Internal server error");
};

module.exports = { handleMongooseError, handleDuplicateKey, handleError };
