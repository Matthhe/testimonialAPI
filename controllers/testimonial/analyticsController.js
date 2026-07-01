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
    logger.error("getAnalytics error", err);
    return sendError(res, 500, "Internal server error");
  }
};
