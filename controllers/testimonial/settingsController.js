const TestimonialSettings = require("../../models/testimonialSettings");
const { SHARE_CHANNELS } = require("../../lib/constants");
const { sendSuccess, sendError } = require("../../lib/response");
const logger = require("../../lib/logger");
const { handleError } = require("../../lib/errors");

const getSettings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const settings = await TestimonialSettings.findOne({ userId }).lean();

    if (!settings) {
      return sendSuccess(res, 200, "No settings found", null);
    }

    return sendSuccess(res, 200, "Data retrieved successfully", settings);
  } catch (err) {
    logger.error("getSettings error", err);
    return handleError(err, res);
  }
};

const updateSettings = async (req, res) => {
  try {
    const allowedFields = [
      "isEnabled",
      "defaultVideoLength",
      "videoLengthOptions",
      "questionnaire",
      "sendingOptions",
      "thankYouMessage",
      "contactConsent",
    ];
    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });

    if (
      updateData.isEnabled !== undefined &&
      typeof updateData.isEnabled !== "boolean"
    ) {
      return sendError(res, 400, "isEnabled must be a boolean");
    }

    if (updateData.defaultVideoLength !== undefined) {
      if (
        typeof updateData.defaultVideoLength !== "number" ||
        updateData.defaultVideoLength <= 0
      ) {
        return sendError(
          res,
          400,
          "defaultVideoLength must be a positive number",
        );
      }
    }

    if (updateData.videoLengthOptions !== undefined) {
      if (
        !Array.isArray(updateData.videoLengthOptions) ||
        !updateData.videoLengthOptions.every(
          (v) => typeof v === "number" && v > 0,
        )
      ) {
        return sendError(
          res,
          400,
          "videoLengthOptions must be an array of positive numbers",
        );
      }
    }

    if (updateData.questionnaire !== undefined) {
      if (
        !Array.isArray(updateData.questionnaire) ||
        !updateData.questionnaire.every((q) => typeof q === "string")
      ) {
        return sendError(res, 400, "questionnaire must be an array of strings");
      }
    }

    if (updateData.sendingOptions) {
      if (
        !Array.isArray(updateData.sendingOptions) ||
        !updateData.sendingOptions.every((opt) => SHARE_CHANNELS.includes(opt))
      ) {
        return sendError(
          res,
          400,
          `sendingOptions must be an array containing only: ${SHARE_CHANNELS.join(", ")}`,
        );
      }
    }

    if (updateData.contactConsent !== undefined) {
      if (
        typeof updateData.contactConsent !== "object" ||
        updateData.contactConsent === null
      ) {
        return sendError(res, 400, "contactConsent must be an object");
      }
      if (
        updateData.contactConsent.enabled !== undefined &&
        typeof updateData.contactConsent.enabled !== "boolean"
      ) {
        return sendError(res, 400, "contactConsent.enabled must be a boolean");
      }
      if (
        updateData.contactConsent.text !== undefined &&
        typeof updateData.contactConsent.text !== "string"
      ) {
        return sendError(res, 400, "contactConsent.text must be a string");
      }
    }

    const settings = await TestimonialSettings.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: updateData },
      { new: true, runValidators: true, upsert: true },
    );

    return sendSuccess(res, 200, "Settings saved", settings);
  } catch (err) {
    logger.error("updateSettings error", err);
    return handleError(err, res);
  }
};

module.exports = { getSettings, updateSettings };
