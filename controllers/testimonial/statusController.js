const Testimonial = require("../../models/testimonial");
const {
  VALID_TRANSITIONS,
  SHARE_CHANNELS,
  STATUSES,
} = require("../../lib/constants");
const { sendSuccess, sendError } = require("../../lib/response");
const logger = require("../../lib/logger");
const { handleError } = require("../../lib/errors");

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const testimonial = await Testimonial.findOne({
      testimonialId: req.params.testimonialId,
      isDeleted: false,
    });

    if (!testimonial) {
      return sendError(res, 404, "Testimonial not found");
    }

    if (testimonial.userId !== req.user.userId) {
      return sendError(res, 403, "Forbidden");
    }

    const allowedTransitions = VALID_TRANSITIONS[testimonial.status] || [];
    if (!allowedTransitions.includes(status)) {
      return sendError(
        res,
        400,
        `Cannot transition from ${testimonial.status} to ${status}`,
      );
    }

    testimonial.status = status;
    if (status === "shared") {
      testimonial.sharedAt = new Date();
    }

    await testimonial.save();

    return sendSuccess(res, 200, "Status updated", testimonial);
  } catch (err) {
    logger.error("updateStatus error", err);
    return handleError(err, res);
  }
};

const bulkStatus = async (req, res) => {
  try {
    const { testimonialIds, status } = req.body;

    if (
      !testimonialIds ||
      !Array.isArray(testimonialIds) ||
      testimonialIds.length === 0
    ) {
      return sendError(res, 400, "testimonialIds must be a non-empty array");
    }
    if (!status) {
      return sendError(res, 400, "status is required");
    }

    if (!STATUSES.includes(status)) {
      return sendError(
        res,
        400,
        `Invalid status. Allowed: ${STATUSES.join(", ")}`,
      );
    }

    const testimonials = await Testimonial.find({
      testimonialId: { $in: testimonialIds },
      userId: req.user.userId,
      isDeleted: false,
    });

    const foundIds = testimonials.map((t) => t.testimonialId);
    const updated = [];
    const failed = [];

    testimonialIds.forEach((id) => {
      if (!foundIds.includes(id)) {
        failed.push({
          testimonialId: id,
          message: "Testimonial not found or access denied",
        });
      }
    });

    testimonials.forEach((t) => {
      const allowed = VALID_TRANSITIONS[t.status] || [];
      if (allowed.includes(status)) {
        t.status = status;
        if (status === "shared") t.sharedAt = new Date();
        updated.push(t);
      } else {
        failed.push({
          testimonialId: t.testimonialId,
          message: `Cannot transition from ${t.status} to ${status}`,
        });
      }
    });

    if (updated.length > 0) {
      const bulkOps = updated.map((t) => ({
        updateOne: {
          filter: { _id: t._id },
          update: {
            $set: {
              status: t.status,
              ...(t.status === "shared" ? { sharedAt: t.sharedAt } : {}),
            },
          },
        },
      }));
      await Testimonial.bulkWrite(bulkOps);
    }

    return sendSuccess(res, 200, "Bulk status update completed", {
      updated: updated.length,
      failed: failed.length,
      errors: failed,
    });
  } catch (err) {
    logger.error("bulkStatus error", err);
    return handleError(err, res);
  }
};

const share = async (req, res) => {
  try {
    const { channels } = req.body;

    if (!channels || !Array.isArray(channels) || channels.length === 0) {
      return sendError(
        res,
        400,
        "Channels are required and must be a non-empty array",
      );
    }

    if (new Set(channels).size !== channels.length) {
      return sendError(res, 400, "Duplicate channels are not allowed");
    }

    const invalidChannels = channels.filter(
      (ch) => typeof ch !== "string" || !SHARE_CHANNELS.includes(ch),
    );
    if (invalidChannels.length > 0) {
      return sendError(
        res,
        400,
        `Invalid channel(s): ${invalidChannels.join(", ")}`,
      );
    }

    const testimonial = await Testimonial.findOne({
      testimonialId: req.params.testimonialId,
      isDeleted: false,
    });

    if (!testimonial) {
      return sendError(res, 404, "Testimonial not found");
    }

    if (testimonial.userId !== req.user.userId) {
      return sendError(res, 403, "Forbidden");
    }

    if (testimonial.status !== "completed" && testimonial.status !== "shared") {
      return sendError(
        res,
        400,
        `Cannot share a testimonial in status "${testimonial.status}". Allowed: completed, shared`,
      );
    }

    if (testimonial.status === "completed") {
      testimonial.status = "shared";
    }

    channels.forEach((channel) => {
      if (!testimonial.sharedChannels.includes(channel)) {
        testimonial.sharedChannels.push(channel);
      }
    });

    if (testimonial.status === "shared" && !testimonial.sharedAt) {
      testimonial.sharedAt = new Date();
    }

    await testimonial.save();

    return sendSuccess(
      res,
      200,
      "Testimonial shared successfully",
      testimonial,
    );
  } catch (err) {
    logger.error("share error", err);
    return handleError(err, res);
  }
};

module.exports = { share, bulkStatus, updateStatus };
