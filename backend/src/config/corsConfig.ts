import { CorsOptions } from 'cors';

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
    if (!origin || origin === allowedOrigin) {
      callback(null, true);
    } else {
      callback(new Error(`CORS Policy Violation: Access denied for origin ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
