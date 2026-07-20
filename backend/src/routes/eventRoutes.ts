import { Router } from 'express';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
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

export default router;
