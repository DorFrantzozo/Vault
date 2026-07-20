import { Request, Response, NextFunction } from 'express';
import { ServiceEvent } from '../models/ServiceEvent.js';
import { AppError } from '../utils/AppError.js';

export const getEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { client, status } = req.query;
    const filter: Record<string, any> = {};

    if (client) filter.client = client;
    if (status) filter.status = status;

    const events = await ServiceEvent.find(filter)
      .populate('client', 'name type contactInfo')
      .sort({ date: -1 });

    res.status(200).json({ status: 'success', results: events.length, data: { events } });
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await ServiceEvent.findById(req.params.id).populate('client', 'name type contactInfo');
    if (!event) {
      return next(new AppError('Service event not found', 404));
    }
    res.status(200).json({ status: 'success', data: { event } });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await ServiceEvent.create(req.body);
    const populatedEvent = await event.populate('client', 'name type');
    res.status(201).json({ status: 'success', data: { event: populatedEvent } });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await ServiceEvent.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('client', 'name type');

    if (!event) {
      return next(new AppError('Service event not found', 404));
    }
    res.status(200).json({ status: 'success', data: { event } });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await ServiceEvent.findByIdAndDelete(req.params.id);
    if (!event) {
      return next(new AppError('Service event not found', 404));
    }
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};
