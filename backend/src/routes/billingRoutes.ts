import express from 'express';
import {
  getBillings,
  getUpcomingBillings,
  createBilling,
  updateBilling,
  deleteBilling,
  markAsPaid,
} from '../controllers/billingController.js';

const router = express.Router();

router.route('/upcoming').get(getUpcomingBillings);
router.route('/:id/paid').patch(markAsPaid);

router
  .route('/')
  .get(getBillings)
  .post(createBilling);

router
  .route('/:id')
  .put(updateBilling)
  .delete(deleteBilling);

export default router;
