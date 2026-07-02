const { sendError } = require("../lib/response");

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const message = error.details.map((d) => d.message).join("; ");
    return sendError(res, 400, message);
  }
  next();
};

module.exports = validate;
