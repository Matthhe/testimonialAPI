const Testimonial = require("../models/testimonial");
const TestimonialSettings = require("../models/testimonialSettings");
const { VALID_TRANSITIONS, SHARE_CHANNELS } = require("../lib/constants");
const { sendSuccess, sendError } = require("../lib/response");
const { Parser } = require("json2csv");

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
    console.error(err);
    if (err.name === "ValidationError") {
      return sendError(res, 400, err.message);
    }
    return sendError(res, 500, "Internal server error");
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

    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "rating",
      "customerName",
    ];
    const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
    if (!allowedSortFields.includes(sortField)) {
      return sendError(
        res,
        400,
        `Invalid sort field. Allowed: ${allowedSortFields.join(", ")}`,
      );
    }

    const allowedStatuses = [
      "draft",
      "recording",
      "processing",
      "completed",
      "shared",
    ];
    if (status && !allowedStatuses.includes(status)) {
      return sendError(
        res,
        400,
        `Invalid status. Allowed: ${allowedStatuses.join(", ")}`,
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
    console.error(err);
    return sendError(res, 500, "Internal server error");
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
    console.error(err);
    return sendError(res, 500, "Internal server error");
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
    console.error(err);
    if (err.name === "ValidationError") {
      return sendError(res, 400, err.message);
    }
    return sendError(res, 500, "Internal server error");
  }
};

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
    console.error(err);
    if (err.name === "ValidationError") {
      return sendError(res, 400, err.message);
    }
    return sendError(res, 500, "Internal server error");
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
    console.error(err);
    return sendError(res, 500, "Internal server error");
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
    console.error(err);
    if (err.name === "ValidationError") {
      return sendError(res, 400, err.message);
    }
    return sendError(res, 500, "Internal server error");
  }
};

const getSettings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const settings = await TestimonialSettings.findOne({ userId }).lean();

    if (!settings) {
      return sendSuccess(res, 200, "No settings found", null);
    }

    return sendSuccess(res, 200, "Data retrieved successfully", settings);
  } catch (err) {
    console.error(err);
    if (err.name === "ValidationError") {
      return sendError(res, 400, err.message);
    }
    return sendError(res, 500, "Internal server error");
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
    console.error(err);
    if (err.name === "ValidationError") {
      return sendError(res, 400, err.message);
    }
    return sendError(res, 500, "Internal server error");
  }
};

const getAnalytics = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;

    if (startDate && isNaN(Date.parse(startDate))) {
      return sendError(res, 400, "Invalid startDate");
    }
    if (endDate && isNaN(Date.parse(endDate))) {
      return sendError(res, 400, "Invalid endDate");
    }

    const match = { userId, isDeleted: false };

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const pipeline = [
      { $match: match },
      {
        $facet: {
          byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
          averageRating: [
            { $match: { rating: { $exists: true, $ne: null } } },
            { $group: { _id: null, avg: { $avg: "$rating" } } },
          ],
          total: [{ $count: "count" }],
        },
      },
      {
        $project: {
          total: { $arrayElemAt: ["$total.count", 0] },
          byStatus: 1,
          averageRating: { $arrayElemAt: ["$averageRating.avg", 0] },
        },
      },
    ];

    const [result] = await Testimonial.aggregate(pipeline);

    const byStatusObj = {};
    if (result && result.byStatus) {
      result.byStatus.forEach((item) => {
        byStatusObj[item._id] = item.count;
      });
    }

    const allStatuses = [
      "draft",
      "recording",
      "processing",
      "completed",
      "shared",
    ];
    allStatuses.forEach((status) => {
      if (!byStatusObj[status]) byStatusObj[status] = 0;
    });

    const data = {
      overview: {
        total: result ? result.total || 0 : 0,
        byStatus: byStatusObj,
        averageRating: result
          ? parseFloat((result.averageRating || 0).toFixed(1))
          : 0,
      },
      period: {
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
      },
    };

    return sendSuccess(res, 200, "Data retrieved successfully", data);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, "Internal server error");
  }
};

const exportCSV = async (req, res) => {
  try {
    const fields = [
      "testimonialId",
      "customerName",
      "customerEmail",
      "customerPhone",
      "videoUrl",
      "rating",
      "text",
      "status",
      "consentGiven",
      "sharedAt",
      "sharedChannels",
      "createdAt",
      "updatedAt",
    ];

    const userId = req.user.userId;
    const { status, startDate, endDate } = req.query;

    if (startDate && isNaN(Date.parse(startDate))) {
      return sendError(res, 400, "Invalid startDate");
    }
    if (endDate && isNaN(Date.parse(endDate))) {
      return sendError(res, 400, "Invalid endDate");
    }

    const filter = { userId, isDeleted: false };
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const testimonials = await Testimonial.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    if (!testimonials.length) {
      return sendError(res, 404, "No testimonials to export");
    }

    const parser = new Parser({ fields });
    const csv = parser.parse(testimonials);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="testimonials.csv"',
    );
    return res.send(csv);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, "Internal server error");
  }
};

const search = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      search: searchText,
      minRating,
      maxRating,
      createdAfter,
      createdBefore,
      page = 1,
      limit = 10,
      sort = "-createdAt",
    } = req.query;

    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      return sendError(res, 400, "Invalid page. Must be a positive integer.");
    }

    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return sendError(res, 400, "Invalid limit. Must be between 1 and 100.");
    }

    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "rating",
      "customerName",
    ];
    const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
    if (!allowedSortFields.includes(sortField)) {
      return sendError(
        res,
        400,
        `Invalid sort field. Allowed: ${allowedSortFields.join(", ")}`,
      );
    }

    const filter = { userId, isDeleted: false };

    if (searchText) {
      const escaped = searchText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { customerName: { $regex: escaped, $options: "i" } },
        { text: { $regex: escaped, $options: "i" } },
      ];
    }

    if (minRating || maxRating) {
      filter.rating = {};
      if (minRating) {
        const min = parseInt(minRating);
        if (isNaN(min) || min < 1 || min > 5)
          return sendError(res, 400, "minRating must be between 1 and 5");
        filter.rating.$gte = min;
      }
      if (maxRating) {
        const max = parseInt(maxRating);
        if (isNaN(max) || max < 1 || max > 5)
          return sendError(res, 400, "maxRating must be between 1 and 5");
        filter.rating.$lte = max;
      }
    }

    if (createdAfter || createdBefore) {
      filter.createdAt = {};
      if (createdAfter) {
        const d = new Date(createdAfter);
        if (isNaN(d.getTime()))
          return sendError(res, 400, "Invalid createdAfter");
        filter.createdAt.$gte = d;
      }
      if (createdBefore) {
        const d = new Date(createdBefore);
        if (isNaN(d.getTime()))
          return sendError(res, 400, "Invalid createdBefore");
        filter.createdAt.$lte = d;
      }
    }

    const safeLimit = Math.min(limitNum, 100);
    const total = await Testimonial.countDocuments(filter);
    const testimonials = await Testimonial.find(filter)
      .sort(sort)
      .skip((pageNum - 1) * safeLimit)
      .limit(safeLimit)
      .lean();

    return sendSuccess(res, 200, "Search results", testimonials, {
      pagination: {
        total,
        page: pageNum,
        limit: safeLimit,
        pages: Math.ceil(total / safeLimit),
      },
    });
  } catch (err) {
    console.error(err);
    return sendError(res, 500, "Internal server error");
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

    const allowedStatuses = [
      "draft",
      "recording",
      "processing",
      "completed",
      "shared",
    ];
    if (!allowedStatuses.includes(status)) {
      return sendError(
        res,
        400,
        `Invalid status. Allowed: ${allowedStatuses.join(", ")}`,
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
        if (status === "shared") {
          t.sharedAt = new Date();
        }
        updated.push(t);
      } else {
        failed.push({
          testimonialId: t.testimonialId,
          message: `Cannot transition from ${t.status} to ${status}`,
        });
      }
    });

    await Promise.all(updated.map((t) => t.save()));

    return sendSuccess(res, 200, "Bulk status update completed", {
      updated: updated.length,
      failed: failed.length,
      errors: failed,
    });
  } catch (err) {
    console.error(err);
    return sendError(res, 500, "Internal server error");
  }
};

module.exports = {
  create,
  getAll,
  getOne,
  update,
  updateStatus,
  remove,
  share,
  getSettings,
  updateSettings,
  getAnalytics,
  exportCSV,
  search,
  bulkStatus,
};
