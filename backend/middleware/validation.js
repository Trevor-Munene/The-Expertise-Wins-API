// backend/middleware/validation.js
const Joi = require('joi');

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map((d) => d.message),
      });
    }
    req.body = value;
    next();
  };
}

const registrationSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  username: Joi.string().trim().min(3).max(30).required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().trim().max(50).allow("", null).optional(),
  lastName: Joi.string().trim().max(50).allow("", null).optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().required(),
});

const updatePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

const updateProfileSchema = Joi.object({
  username: Joi.string().trim().min(3).max(30).required(),
  firstName: Joi.string().trim().max(50).allow(""),
  lastName: Joi.string().trim().max(50).allow(""),
});

module.exports = {
  validateRegistration: validate(registrationSchema),
  validateLogin: validate(loginSchema),
  validateUpdatePassword: validate(updatePasswordSchema),
  validateUpdateProfile: validate(updateProfileSchema),
};
