import { Request, Response, NextFunction } from 'express';
import { Client } from '../models/Client.js';
import { AppError } from '../utils/AppError.js';

export const getClients = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clients = await Client.find().sort({ name: 1 });
    res.status(200).json({ status: 'success', results: clients.length, data: { clients } });
  } catch (error) {
    next(error);
  }
};

export const getClientById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return next(new AppError('Client not found', 404));
    }
    res.status(200).json({ status: 'success', data: { client } });
  } catch (error) {
    next(error);
  }
};

export const createClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const client = await Client.create(req.body);
    res.status(201).json({ status: 'success', data: { client } });
  } catch (error) {
    next(error);
  }
};

export const updateClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!client) {
      return next(new AppError('Client not found', 404));
    }
    res.status(200).json({ status: 'success', data: { client } });
  } catch (error) {
    next(error);
  }
};

export const deleteClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) {
      return next(new AppError('Client not found', 404));
    }
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};
