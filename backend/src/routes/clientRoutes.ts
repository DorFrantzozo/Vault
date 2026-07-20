import { Router } from 'express';
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} from '../controllers/clientController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { createClientSchema, updateClientSchema } from '../schemas/clientSchemas.js';

const router = Router();

router.use(protect);

router.route('/').get(getClients).post(validateRequest(createClientSchema), createClient);

router
  .route('/:id')
  .get(getClientById)
  .put(validateRequest(updateClientSchema), updateClient)
  .delete(deleteClient);

export default router;
