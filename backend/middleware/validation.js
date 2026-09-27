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
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().max(100).optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().max(100),
  username: Joi.string().alphanum().min(3).max(30),
  firstName: Joi.string().max(50),
  lastName: Joi.string().max(50),
  telegramUsername: Joi.string().max(50),
}).or('name', 'username', 'firstName', 'lastName', 'telegramUsername');

module.exports = {
  validateRegistration: validate(registrationSchema),
  validateLogin: validate(loginSchema),
  validateUpdatePassword: validate(updatePasswordSchema),
  validateUpdateProfile: validate(updateProfileSchema),
};
