import express from 'express';
import {
  getBillings,
  getUpcomingBillings,
  createBilling,
  updateBilling,
  deleteBilling,
  markAsPaid,
  getBillingHistory,
} from '../controllers/billingController.js';

const router = express.Router();

router.route('/upcoming').get(getUpcomingBillings);
router.route('/:id/paid').patch(markAsPaid);
router.route('/:id/history').get(getBillingHistory);

router
  .route('/')
  .get(getBillings)
  .post(createBilling);

router
  .route('/:id')
  .put(updateBilling)
  .delete(deleteBilling);

export default router;
