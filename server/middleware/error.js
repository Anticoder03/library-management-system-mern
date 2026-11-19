import mongoose from 'mongoose';
import multer from 'multer';
import { isProduction } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const handleCastError = (err) =>
  new ApiError(400, `Invalid value for ${err.path}: ${err.value}`);

const handleDuplicateKey = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  return ApiError.conflict(`${field} already exists. Please use another value.`);
};

const handleValidationError = (err) =>
  ApiError.badRequest(
    'Validation failed',
    Object.values(err.errors).map((item) => ({ field: item.path, message: item.message }))
  );

export const notFoundHandler = (req, _res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
};

export const errorHandler = (err, _req, res, _next) => {
  let error = err;

  if (err instanceof multer.MulterError) {
    error = ApiError.badRequest(
      err.code === 'LIMIT_FILE_SIZE' ? 'Image must be smaller than 5 MB' : err.message
    );
  } else if (err instanceof ApiError) {
    error = err;
  } else if (err instanceof mongoose.Error.CastError) {
    error = handleCastError(err);
  } else if (err instanceof mongoose.Error.ValidationError) {
    error = handleValidationError(err);
  } else if (err.code === 11000) {
    error = handleDuplicateKey(err);
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Invalid or expired token');
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Something went wrong';

  if (statusCode === 500) console.error('[ERROR]', err);

  res.status(statusCode).json({
    success: false,
    message,
    ...(error.errors?.length ? { errors: error.errors } : {}),
    ...(isProduction ? {} : { stack: err.stack }),
  });
};
