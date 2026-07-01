const Testimonial = require("../../models/testimonial");
const { STATUSES, ALLOWED_SORT_FIELDS } = require("../../lib/constants");
const { sendSuccess, sendError } = require("../../lib/response");
const logger = require("../../lib/logger");
const { handleError } = require("../../lib/errors");

const create = async (req, res) => {
  try {
    const { customerName } = req.body;

    if (!customerName) {
      return sendError(res, 400, "customerName is required.");
    }

    const allowedFields = [
      "customerName",
      "customerEmail",
      "customerPhone",
      "videoUrl",
      "rating",
      "text",
      "consentGiven",
    ];
    const data = { userId: req.user.userId };
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    });

    const testimonial = new Testimonial(data);
    await testimonial.save();

    return sendSuccess(
      res,
      201,
      "Testimonial created successfully.",
      testimonial,
    );
  } catch (err) {
    logger.error("create error", err);
    return handleError(err, res);
  }
};

const getAll = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, page = 1, limit = 10, sort = "-createdAt" } = req.query;

    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      return sendError(res, 400, "Invalid page. Must be a positive integer.");
    }

    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return sendError(res, 400, "Invalid limit. Must be between 1 and 100.");
    }

    const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
    if (!ALLOWED_SORT_FIELDS.includes(sortField)) {
      return sendError(
        res,
        400,
        `Invalid sort field. Allowed: ${ALLOWED_SORT_FIELDS.join(", ")}`, 
      );
    }

    if (status && !STATUSES.includes(status)) {
      return sendError(
        res,
        400,
        `Invalid status. Allowed: ${STATUSES.join(", ")}`,
      );
    }

    const filter = { userId, isDeleted: false };
    if (status) filter.status = status;

    const safeLimit = Math.min(limitNum, 100);
    const total = await Testimonial.countDocuments(filter);
    const testimonials = await Testimonial.find(filter)
      .sort(sort)
      .skip((pageNum - 1) * safeLimit)
      .limit(safeLimit)
      .lean();

    return sendSuccess(res, 200, "Data retrieved successfully", testimonials, {
      pagination: {
        total,
        page: pageNum,
        limit: safeLimit,
        pages: Math.ceil(total / safeLimit),
      },
    });
  } catch (err) {
    logger.error("getAll error", err);
    return handleError(err, res);
  }
};

const getOne = async (req, res) => {
  try {
    const testimonial = await Testimonial.findOne({
      testimonialId: req.params.testimonialId,
      isDeleted: false,
    }).lean();

    if (!testimonial) {
      return sendError(res, 404, "Testimonial not found");
    }

    if (testimonial.userId !== req.user.userId) {
      return sendError(res, 403, "Forbidden");
    }

    return sendSuccess(res, 200, "Testimonial retrieved", testimonial);
  } catch (err) {
    logger.error("getOne error", err);
    return handleError(err, res);
  }
};

const update = async (req, res) => {
  try {
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

    const allowedUpdates = [
      "customerName",
      "customerEmail",
      "customerPhone",
      "videoUrl",
      "rating",
      "text",
      "consentGiven",
    ];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        testimonial[field] = req.body[field];
      }
    });

    await testimonial.save();

    return sendSuccess(res, 200, "Testimonial updated", testimonial);
  } catch (err) {
    logger.error("update error", err);
    return handleError(err, res);
  }
};

const remove = async (req, res) => {
  try {
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

    testimonial.isDeleted = true;
    testimonial.deletedAt = new Date();
    await testimonial.save();

    return sendSuccess(res, 200, "Testimonial deleted");
  } catch (err) {
    logger.error("remove error", err);
    return handleError(err, res);
  }
};

module.exports = { create, getAll, getOne, update, remove };
