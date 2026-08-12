import { Request, Response, NextFunction } from 'express';
import { ServiceEvent } from '../models/ServiceEvent.js';
import { Transaction } from '../models/Transaction.js';
import { AppError } from '../utils/AppError.js';

export const getEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { client, status } = req.query;
    const filter: Record<string, any> = {};

    if (client) filter.client = client;
    if (status) filter.status = status;

    const events = await ServiceEvent.find(filter)
      .populate('client', 'name type contactInfo color')
      .sort({ date: -1 });

    res.status(200).json({ status: 'success', results: events.length, data: { events } });
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await ServiceEvent.findById(req.params.id).populate('client', 'name type contactInfo color');
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
    const populatedEvent = await event.populate('client', 'name type color');
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
    }).populate('client', 'name type color');

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

export const markEventsAsPaidForClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clientId = req.params.clientId;
    const { eventIds } = req.body || {};

    // Ensure eventIds is an array and not empty, to strictly only collect selected events
    if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
      return next(new AppError('No specific events selected for collection', 400));
    }

    const query = {
      client: clientId,
      isPaid: false,
      _id: { $in: eventIds }
    };

    const unpaidEvents = await ServiceEvent.find(query);

    if (unpaidEvents.length === 0) {
      return next(new AppError('No valid unpaid events found for this selection', 400));
    }

    const totalAmount = unpaidEvents.reduce((sum, ev) => sum + (ev.amount || 0), 0);

    // 1. Create individual transactions for each event using its specific event date to allocate income to the correct month
    const transactionsData = unpaidEvents.map(ev => ({
      type: 'Income',
      amount: ev.amount,
      date: ev.date,
      client: clientId,
      serviceType: ev.type || 'General',
      relatedEvent: ev._id,
      notes: `גביית תשלום עבור ${ev.description || ev.type || 'עבודה'} מיום ${new Date(ev.date).toLocaleDateString('he-IL')}`,
    }));

    await Transaction.insertMany(transactionsData);

    // 2. Mark specifically these events as paid
    await ServiceEvent.updateMany(
      query,
      { $set: { isPaid: true } }
    );

    res.status(200).json({
      status: 'success',
      message: `Successfully marked ${unpaidEvents.length} events as paid. Created transaction for ${totalAmount}.`,
      data: {
        eventsUpdated: unpaidEvents.length,
        totalAmount,
      }
    });
  } catch (error) {
    next(error);
  }
};

export const markEventPaid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await ServiceEvent.findById(req.params.id);
    if (!event) {
      return next(new AppError('Service event not found', 404));
    }

    if (event.isPaid) {
      return next(new AppError('Event is already marked as paid', 400));
    }

    if (!event.amount || event.amount <= 0) {
      return next(new AppError('Cannot mark a zero-amount event as paid', 400));
    }

    const transaction = await Transaction.create({
      type: 'Income',
      amount: event.amount,
      date: event.date,
      client: event.client,
      serviceType: event.type,
      relatedEvent: event._id,
      notes: `גביית תשלום עבור ${event.description || event.type} מיום ${new Date(event.date).toLocaleDateString('he-IL')}`,
    });

    event.isPaid = true;
    await event.save();
    const populatedEvent = await event.populate('client', 'name type color');

    res.status(200).json({
      status: 'success',
      data: { event: populatedEvent, transaction },
    });
  } catch (error) {
    next(error);
  }
};

export const markEventUnpaid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await ServiceEvent.findById(req.params.id);
    if (!event) {
      return next(new AppError('Service event not found', 404));
    }

    if (!event.isPaid) {
      return next(new AppError('Event is not marked as paid', 400));
    }

    const deleteResult = await Transaction.deleteMany({ relatedEvent: event._id });

    event.isPaid = false;
    await event.save();
    const populatedEvent = await event.populate('client', 'name type color');

    res.status(200).json({
      status: 'success',
      data: { event: populatedEvent, deletedCount: deleteResult.deletedCount },
    });
  } catch (error) {
    next(error);
  }
};
