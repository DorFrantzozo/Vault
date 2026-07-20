import { Router } from 'express';
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionSummary,
} from '../controllers/transactionController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { uploadSingleReceipt } from '../middlewares/uploadMiddleware.js';
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionFilterSchema,
} from '../schemas/transactionSchemas.js';

const router = Router();

router.use(protect);

router.get('/summary', getTransactionSummary);

router
  .route('/')
  .get(validateRequest(transactionFilterSchema), getTransactions)
  .post(uploadSingleReceipt, validateRequest(createTransactionSchema), createTransaction);

router
  .route('/:id')
  .get(getTransactionById)
  .put(uploadSingleReceipt, validateRequest(updateTransactionSchema), updateTransaction)
  .delete(deleteTransaction);

export default router;
