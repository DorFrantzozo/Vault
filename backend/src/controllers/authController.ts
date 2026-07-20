import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

const COOKIE_NAME = 'token';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_32_chars';

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username }).select('+password');
    if (!user) {
      return next(new AppError('Invalid credentials.', 401));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new AppError('Invalid credentials.', 401));
    }

    const token = jwt.sign(
      { _id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          _id: user._id,
          username: user.username,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password } = req.body;

    const existingUserCount = await User.countDocuments();
    if (existingUserCount > 0) {
      return next(new AppError('Registration is locked. An admin account already exists.', 403));
    }

    const user = await User.create({ username, password });

    const token = jwt.sign(
      { _id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          _id: user._id,
          username: user.username,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (_req: Request, res: Response): void => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.status(200).json({ status: 'success', message: 'Logged out successfully.' });
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      return next(new AppError('Unauthenticated', 401));
    }
    res.status(200).json({
      status: 'success',
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
};
