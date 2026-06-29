const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const {
  STATUSES,
  DEFAULT_STATUS,
  SHARE_CHANNELS,
} = require("../lib/constants");

const testimonialSchema = new mongoose.Schema(
  {
    testimonialId: {
      type: String,
      default: () => uuidv4(),
      unique: true,
    },
    userId: {
      type: Number,
      required: [true, "userId is required"],
    },
    customerName: {
      type: String,
      required: [true, "customerName is required"],
    },
    customerEmail: {
      type: String,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"],
    },
    customerPhone: {
      type: String,
    },
    videoUrl: {
      type: String,
    },
    rating: {
      type: Number,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating must be at most 5"],
    },
    text: {
      type: String,
    },
    status: {
      type: String,
      enum: STATUSES,
      default: DEFAULT_STATUS,
    },
    consentGiven: {
      type: Boolean,
      default: false,
    },
    sharedAt: {
      type: Date,
    },
    sharedChannels: [
      {
        type: String,
        enum: SHARE_CHANNELS,
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

//testimonialSchema.index({ testimonialId: 1 }, { unique: true });
testimonialSchema.index({ userId: 1 });
testimonialSchema.index({ status: 1 });
testimonialSchema.index({ userId: 1, isDeleted: 1 });

const Testimonial = mongoose.model("Testimonial", testimonialSchema);
module.exports = Testimonial;
