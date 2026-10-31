process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Request, Response } from 'express';
import { AppModule } from './app.module';

const server = express();
let isReady = false;

// Middleware to normalize URL in case Vercel stripped or preserved /api prefix
server.use((req, res, next) => {
  if (req.url.startsWith('/v1/')) {
    req.url = '/api' + req.url;
  }
  next();
});

async function bootstrapServer() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: true,
    credentials: true,
  });
  await app.init();
  isReady = true;
  return app;
}

const bootstrapPromise = bootstrapServer();

export default async function handler(req: Request, res: Response) {
  if (!isReady) {
    await bootstrapPromise;
  }
  server(req, res);
}

// Local dev / Docker runner
if (!process.env.VERCEL) {
  bootstrapPromise.then(() => {
    const port = process.env.PORT || 4000;
    server.listen(port, () => {
      console.log(`API running on http://localhost:${port}/api/v1`);
    });
  });
}
