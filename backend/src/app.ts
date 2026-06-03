import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env, isTest } from './config/env';
import { buildApiRouter } from './routes';
import { errorHandler, notFoundHandler } from './middleware/error';

export function createApp(): Application {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_URL.split(',').map((s) => s.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(compression());
  if (!isTest) app.use(morgan('dev'));

  const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(env.API_PREFIX, limiter);

  // Health checks.
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'hms-backend', time: new Date().toISOString() });
  });
  app.get(`${env.API_PREFIX}/health`, (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.use(env.API_PREFIX, buildApiRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
