import { Request, Response, NextFunction } from 'express';
import { RecurringBilling } from '../models/RecurringBilling.js';
import { Transaction } from '../models/Transaction.js';
import { AppError } from '../utils/AppError.js';

export const getBillings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const billings = await RecurringBilling.find().populate('client', 'name type').sort({ nextBillingDate: 1 });
    res.status(200).json({ status: 'success', results: billings.length, data: { billings } });
  } catch (error) {
    next(error);
  }
};

export const getUpcomingBillings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Today (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Today + 5 days (end of day)
    const fiveDaysFromNow = new Date(today);
    fiveDaysFromNow.setDate(today.getDate() + 5);
    fiveDaysFromNow.setHours(23, 59, 59, 999);

    const billings = await RecurringBilling.find({
      isActive: true,
      nextBillingDate: {
        $gte: today,
        $lte: fiveDaysFromNow,
      },
    }).sort({ nextBillingDate: 1 });

    res.status(200).json({ status: 'success', results: billings.length, data: { billings } });
  } catch (error) {
    next(error);
  }
};

export const createBilling = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const billing = await RecurringBilling.create(req.body);
    res.status(201).json({ status: 'success', data: { billing } });
  } catch (error) {
    next(error);
  }
};

export const updateBilling = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const billing = await RecurringBilling.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!billing) {
      return next(new AppError('Billing record not found', 404));
    }
    res.status(200).json({ status: 'success', data: { billing } });
  } catch (error) {
    next(error);
  }
};

export const deleteBilling = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const billing = await RecurringBilling.findByIdAndDelete(req.params.id);
    if (!billing) {
      return next(new AppError('Billing record not found', 404));
    }
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};

export const markAsPaid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const billing = await RecurringBilling.findById(req.params.id);
    if (!billing) {
      return next(new AppError('Billing record not found', 404));
    }

    await Transaction.create({
      type: 'Income',
      amount: billing.amount,
      date: new Date(),
      client: billing.client || undefined,
      serviceType: 'Maintenance',
      relatedBilling: billing._id,
      notes: `תשלום תקופתי עבור ${billing.serviceDescription || billing.clientName || 'לקוח'}`,
    });

    const nextDate = new Date(billing.nextBillingDate);
    if (billing.billingCycle === 'Monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (billing.billingCycle === 'Yearly') {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }

    billing.nextBillingDate = nextDate;
    await billing.save();

    res.status(200).json({ status: 'success', data: { billing } });
  } catch (error) {
    next(error);
  }
};

export const getBillingHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const transactions = await Transaction.find({ relatedBilling: req.params.id }).populate('client', 'name').sort({ date: -1 });
    res.status(200).json({ status: 'success', results: transactions.length, data: { transactions } });
  } catch (error) {
    next(error);
  }
};
