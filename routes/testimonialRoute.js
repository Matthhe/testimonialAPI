const express = require("express");
const router = express.Router();
const testimonialController = require("../controllers/testimonialController");
const verifyJWT = require("../middleware/auth");

router.use(verifyJWT);

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.get("/settings", asyncHandler(testimonialController.getSettings));
router.post("/settings", asyncHandler(testimonialController.updateSettings));
router.get("/analytics", asyncHandler(testimonialController.getAnalytics));

router.post("/", asyncHandler(testimonialController.create));
router.get("/", asyncHandler(testimonialController.getAll));
router.get("/export", asyncHandler(testimonialController.exportCSV));
router.get("/search", asyncHandler(testimonialController.search));
router.post("/bulk/status", asyncHandler(testimonialController.bulkStatus));
router.get("/:testimonialId", asyncHandler(testimonialController.getOne));
router.put("/:testimonialId", asyncHandler(testimonialController.update));
router.patch(
  "/:testimonialId/status",
  asyncHandler(testimonialController.updateStatus),
);
router.delete("/:testimonialId", asyncHandler(testimonialController.remove));
router.post("/:testimonialId/share", asyncHandler(testimonialController.share));

module.exports = router;
