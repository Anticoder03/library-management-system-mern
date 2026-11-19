import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

export const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const formatted = errors.array().map((error) => ({
    field: error.path || error.param,
    message: error.msg,
  }));
  return next(ApiError.badRequest('Validation failed', formatted));
};
