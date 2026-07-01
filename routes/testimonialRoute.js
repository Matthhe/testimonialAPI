const express = require("express");
const router = express.Router();
const testimonialController = require("../controllers/testimonial");
const verifyJWT = require("../middleware/auth");
const validate = require("../middleware/validate");
const asyncHandler = require("../middleware/asyncHandler");

const {
  testimonialCreateSchema,
  testimonialUpdateSchema,
  updateStatusSchema,
  shareSchema,
  settingsSchema,
  bulkStatusSchema,
} = require("../validation/schemas");

router.use(verifyJWT);

router.get("/settings", asyncHandler(testimonialController.getSettings));
router.post(
  "/settings",
  validate(settingsSchema),
  asyncHandler(testimonialController.updateSettings),
);
router.get("/analytics", asyncHandler(testimonialController.getAnalytics));

router.post(
  "/",
  validate(testimonialCreateSchema),
  asyncHandler(testimonialController.create),
);
router.get("/", asyncHandler(testimonialController.getAll));
router.get("/export", asyncHandler(testimonialController.exportCSV));
router.get("/search", asyncHandler(testimonialController.search));
router.post(
  "/bulk/status",
  validate(bulkStatusSchema),
  asyncHandler(testimonialController.bulkStatus),
);
router.get("/:testimonialId", asyncHandler(testimonialController.getOne));
router.put(
  "/:testimonialId",
  validate(testimonialUpdateSchema),
  asyncHandler(testimonialController.update),
);
router.patch(
  "/:testimonialId/status",
  validate(updateStatusSchema),
  asyncHandler(testimonialController.updateStatus),
);
router.delete("/:testimonialId", asyncHandler(testimonialController.remove));
router.post(
  "/:testimonialId/share",
  validate(shareSchema),
  asyncHandler(testimonialController.share),
);

module.exports = router;
