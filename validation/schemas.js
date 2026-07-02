const Joi = require("joi");

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  businessName: Joi.string().required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const testimonialCreateSchema = Joi.object({
  customerName: Joi.string().required(),
  customerEmail: Joi.string().email().optional(),
  customerPhone: Joi.string().optional(),
  videoUrl: Joi.string().uri().optional(),
  rating: Joi.number().integer().min(1).max(5).optional(),
  text: Joi.string().optional(),
  consentGiven: Joi.boolean().optional(),
}).unknown(true);

const testimonialUpdateSchema = Joi.object({
  customerName: Joi.string().optional(),
  customerEmail: Joi.string().email().optional(),
  customerPhone: Joi.string().optional(),
  videoUrl: Joi.string().uri().optional(),
  rating: Joi.number().integer().min(1).max(5).optional(),
  text: Joi.string().optional(),
  consentGiven: Joi.boolean().optional(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid("draft", "recording", "processing", "completed", "shared")
    .required(),
});

const shareSchema = Joi.object({
  channels: Joi.array()
    .items(Joi.string().valid("email", "sms", "facebook", "instagram"))
    .min(1)
    .unique()
    .required(),
});

const settingsSchema = Joi.object({
  isEnabled: Joi.boolean().optional(),
  defaultVideoLength: Joi.number().positive().optional(),
  videoLengthOptions: Joi.array().items(Joi.number().positive()).optional(),
  questionnaire: Joi.array().items(Joi.string()).optional(),
  sendingOptions: Joi.array()
    .items(Joi.string().valid("email", "sms", "facebook", "instagram"))
    .optional(),
  thankYouMessage: Joi.string().optional(),
  contactConsent: Joi.object({
    enabled: Joi.boolean().optional(),
    text: Joi.string().optional(),
  }).optional(),
});

const bulkStatusSchema = Joi.object({
  testimonialIds: Joi.array().items(Joi.string()).min(1).required(),
  status: Joi.string()
    .valid("draft", "recording", "processing", "completed", "shared")
    .required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  testimonialCreateSchema,
  testimonialUpdateSchema,
  updateStatusSchema,
  shareSchema,
  settingsSchema,
  bulkStatusSchema,
};
