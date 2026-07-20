import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';
import { IUserPayload } from '../types/express.js';

export const protect = (req: Request, _res: Response, next: NextFunction): void => {
  const token = req.cookies?.token;

  if (!token) {
    return next(new AppError('Unauthorized: Access denied. Please log in.', 401));
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_32_chars';
    const decoded = jwt.verify(token, jwtSecret) as IUserPayload;

    req.user = {
      _id: decoded._id,
      username: decoded.username,
    };

    next();
  } catch (error) {
    return next(new AppError('Unauthorized: Invalid or expired token.', 401));
  }
};
