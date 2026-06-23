const mongoose = require("mongoose");
const {
  DEFAULT_VIDEO_LENGTH,
  VIDEO_LENGTH_OPTIONS,
  QUESTIONNAIRE,
  SENDING_OPTIONS,
  DEFAULT_THANK_YOU,
  DEFAULT_CONTACT_CONSENT,
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
    },
    videoLengthOptions: {
      type: [Number],
      default: VIDEO_LENGTH_OPTIONS,
    },
    questionnaire: {
      type: [String],
      default: QUESTIONNAIRE,
    },
    sendingOptions: {
      type: [String],
      default: SENDING_OPTIONS,
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
