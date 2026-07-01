const ROLES = ["owner", "staff"];
const DEFAULT_ROLE = "owner";

const STATUSES = ["draft", "recording", "processing", "completed", "shared"];
const DEFAULT_STATUS = "draft";

const SHARE_CHANNELS = ["email", "sms", "facebook", "instagram"];

const VALID_TRANSITIONS = {
  draft: ["recording"],
  recording: ["processing"],
  processing: ["completed"],
  completed: ["shared"],
};

const ALLOWED_SORT_FIELDS = ["createdAt", "updatedAt", "rating", "customerName",]

const DEFAULT_VIDEO_LENGTH = 10;
const VIDEO_LENGTH_OPTIONS = [5, 10, 15, 20, 25];
const QUESTIONNAIRE = ["What do you like about our service?"];
const SENDING_OPTIONS = ["email", "sms"];
const DEFAULT_THANK_YOU = "Thank you!";
const DEFAULT_CONTACT_CONSENT = {
  enabled: true,
  text: "Join our mailing list",
};

module.exports = {
  ROLES,
  DEFAULT_ROLE,
  STATUSES,
  DEFAULT_STATUS,
  SHARE_CHANNELS,
  VALID_TRANSITIONS,
  DEFAULT_VIDEO_LENGTH,
  VIDEO_LENGTH_OPTIONS,
  QUESTIONNAIRE,
  SENDING_OPTIONS,
  DEFAULT_THANK_YOU,
  DEFAULT_CONTACT_CONSENT,
};
