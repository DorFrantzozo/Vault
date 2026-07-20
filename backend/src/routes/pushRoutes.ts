import express from 'express';
import { subscribeToPush, getVapidPublicKey, sendTestNotification } from '../controllers/pushController.js';

const router = express.Router();

router.post('/subscribe', subscribeToPush);
router.get('/vapid-public-key', getVapidPublicKey);
router.post('/test', sendTestNotification);

export default router;
