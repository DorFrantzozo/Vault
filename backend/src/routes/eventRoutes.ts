import { Router } from 'express';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  markEventsAsPaidForClient,
  markEventPaid,
  markEventUnpaid,
} from '../controllers/eventController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { createEventSchema, updateEventSchema } from '../schemas/eventSchemas.js';

const router = Router();

router.use(protect);

router.route('/').get(getEvents).post(validateRequest(createEventSchema), createEvent);

router
  .route('/:id')
  .get(getEventById)
  .put(validateRequest(updateEventSchema), updateEvent)
  .delete(deleteEvent);

router.post('/client/:clientId/mark-paid', markEventsAsPaidForClient);
router.post('/:id/mark-paid', markEventPaid);
router.post('/:id/mark-unpaid', markEventUnpaid);

export default router;
