import express from 'express';
import {
  getNotificationSettings,
  updateNotificationSettings,
  subscribeNotification,
} from '../controllers/settingsController.js';

const router = express.Router();

router.get('/notifications', getNotificationSettings);
router.put('/notifications', updateNotificationSettings);
router.post('/notifications/subscribe', subscribeNotification);

export default router;
