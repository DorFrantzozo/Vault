import { CorsOptions } from 'cors';

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
    console.log('[CORS Debug] Request Origin:', origin, '| Allowed Origin:', allowedOrigin);
    
    if (
      !origin ||
      origin === allowedOrigin ||
      origin.endsWith('.vercel.app') ||
      /^https:\/\/vault-.*-dors-projects-.*\.vercel\.app$/.test(origin)
    ) {
      callback(null, true);
    } else {
      console.warn('[CORS Blocked] Origin not allowed:', origin);
      callback(new Error(`CORS Policy Violation: Access denied for origin ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
