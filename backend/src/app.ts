import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { swaggerSpec } from './config/swagger';
import { apiLimiter } from './middleware/rateLimiter';
import { sendError } from './utils/response';

const app = express();

// Security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS Configuration
app.use(cors({
  origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory for item and proof photos
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Swagger Documentation UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// General API Rate Limiting & Routes
app.use(config.apiPrefix, apiLimiter, routes);

// Root redirect or welcome
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Injibara University Campus Lost & Found API',
    status: 'online',
    docs: '/api/docs',
    version: '1.0.0'
  });
});

// 404 handler for undefined routes
app.use((req: Request, res: Response) => {
  sendError(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
});

// Global centralized error handling middleware
app.use(errorHandler);

export default app;
