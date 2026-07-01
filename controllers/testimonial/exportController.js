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
      .limit(10000)
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
    logger.error("exportCSV error", err);
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
      filter.$text = { $search: searchText };
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
    logger.error("search error", err);
    return sendError(res, 500, "Internal server error");
  }
};
