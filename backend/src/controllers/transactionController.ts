import { Request, Response, NextFunction } from 'express';
import { Transaction } from '../models/Transaction.js';
import { AppError } from '../utils/AppError.js';
import { uploadImageStream, deleteImage } from '../utils/cloudinaryService.js';

export const getTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate, type, client } = req.query;
    const filter: Record<string, any> = {};

    if (type) filter.type = type;
    if (client) filter.client = client;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) filter.date.$lte = new Date(endDate as string);
    }

    const transactions = await Transaction.find(filter)
      .populate('client', 'name type')
      .populate('relatedEvent', 'type date status')
      .sort({ date: -1 });

    res.status(200).json({ status: 'success', results: transactions.length, data: { transactions } });
  } catch (error) {
    next(error);
  }
};

export const getTransactionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('client', 'name type')
      .populate('relatedEvent', 'type date status');

    if (!transaction) {
      return next(new AppError('Transaction not found', 404));
    }
    res.status(200).json({ status: 'success', data: { transaction } });
  } catch (error) {
    next(error);
  }
};

export const createTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const payload = { ...req.body };

    if (req.file) {
      const uploadResult = await uploadImageStream(req.file.buffer);
      payload.attachmentUrl = uploadResult.secureUrl;
      payload.publicId = uploadResult.publicId;
    }

    const transaction = await Transaction.create(payload);
    const populated = await transaction.populate([
      { path: 'client', select: 'name type' },
      { path: 'relatedEvent', select: 'type date status' },
    ]);
    res.status(201).json({ status: 'success', data: { transaction: populated } });
  } catch (error) {
    next(error);
  }
};

export const updateTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existingTransaction = await Transaction.findById(req.params.id);
    if (!existingTransaction) {
      return next(new AppError('Transaction not found', 404));
    }

    const payload = { ...req.body };

    if (req.file) {
      if (existingTransaction.publicId) {
        await deleteImage(existingTransaction.publicId);
      }
      const uploadResult = await uploadImageStream(req.file.buffer);
      payload.attachmentUrl = uploadResult.secureUrl;
      payload.publicId = uploadResult.publicId;
    }

    const updatedTransaction = await Transaction.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    }).populate([
      { path: 'client', select: 'name type' },
      { path: 'relatedEvent', select: 'type date status' },
    ]);

    res.status(200).json({ status: 'success', data: { transaction: updatedTransaction } });
  } catch (error) {
    next(error);
  }
};

export const deleteTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return next(new AppError('Transaction not found', 404));
    }

    if (transaction.publicId) {
      await deleteImage(transaction.publicId);
    }

    await transaction.deleteOne();
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};

export const getTransactionSummary = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const summary = await Transaction.aggregate([
      {
        $facet: {
          monthlyIncome: [
            { $match: { type: 'Income', date: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ],
          monthlyExpenses: [
            { $match: { type: 'Expense', date: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ],
          annualIncome: [
            { $match: { type: 'Income', date: { $gte: startOfYear } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ],
          annualExpenses: [
            { $match: { type: 'Expense', date: { $gte: startOfYear } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ],
        },
      },
    ]);

    const facet = summary[0];
    const totalMonthlyIncome = facet.monthlyIncome[0]?.total || 0;
    const totalMonthlyExpenses = facet.monthlyExpenses[0]?.total || 0;
    const totalAnnualIncome = facet.annualIncome[0]?.total || 0;
    const totalAnnualExpenses = facet.annualExpenses[0]?.total || 0;
    const annualNet = totalAnnualIncome - totalAnnualExpenses;

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          monthlyIncome: totalMonthlyIncome,
          monthlyExpenses: totalMonthlyExpenses,
          annualIncome: totalAnnualIncome,
          annualExpenses: totalAnnualExpenses,
          annualNet,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
