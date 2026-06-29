const mongoose = require("mongoose");
const {
  DEFAULT_VIDEO_LENGTH,
  VIDEO_LENGTH_OPTIONS,
  QUESTIONNAIRE,
  SENDING_OPTIONS,
  DEFAULT_THANK_YOU,
  DEFAULT_CONTACT_CONSENT,
  SHARE_CHANNELS,
} = require("../lib/constants");

const testimonialSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      required: [true, "userId is required"],
      unique: true,
    },
    isEnabled: {
      type: Boolean,
      default: false,
    },
    defaultVideoLength: {
      type: Number,
      default: DEFAULT_VIDEO_LENGTH,
      min: [1, "defaultVideoLength must be at least 1"],
    },
    videoLengthOptions: {
      type: [Number],
      default: VIDEO_LENGTH_OPTIONS,
      validate: {
        validator: function (arr) {
          return arr.every((v) => typeof v === "number" && v > 0);
        },
        message: "videoLengthOptions must be an array of positive numbers",
      },
    },
    questionnaire: {
      type: [String],
      default: QUESTIONNAIRE,
    },
    sendingOptions: {
      type: [String],
      default: SENDING_OPTIONS,
      validate: {
        validator: function (arr) {
          return arr.every((opt) => SHARE_CHANNELS.includes(opt));
        },
        message: `sendingOptions must contain only: ${SHARE_CHANNELS.join(", ")}`,
      },
    },
    thankYouMessage: {
      type: String,
      default: DEFAULT_THANK_YOU,
    },
    contactConsent: {
      enabled: {
        type: Boolean,
        default: DEFAULT_CONTACT_CONSENT.enabled,
      },
      text: {
        type: String,
        default: DEFAULT_CONTACT_CONSENT.text,
      },
    },
  },
  { timestamps: true },
);

const TestimonialSettings = mongoose.model(
  "TestimonialSettings",
  testimonialSettingsSchema,
);
module.exports = TestimonialSettings;
