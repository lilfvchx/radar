import express from 'express';
import cors from 'cors';
import path from 'path';
import 'dotenv/config';
import flightsRouter from './routes/flights';
import maritimeRouter from './routes/maritime';
import geoRouter from './routes/geo';
import monitorRouter from './routes/monitor';
import cyberRouter from './routes/cyber';
import arCrimeRouter from './routes/ar_crime';
import cronRouter from './routes/cron';
import { aircraftDb } from './core/aircraft_db';

const app = express();

app.use(cors());
app.use(express.json());

// Lazy-load the aircraft database on the first request if it hasn't loaded
let isAircraftDbLoaded = false;
app.use(async (_req, _res, next) => {
  if (!isAircraftDbLoaded) {
    isAircraftDbLoaded = true;
    aircraftDb.load().catch(e => console.error('Failed to initialize aircraft DB:', e));
  }
  next();
});

app.use('/api/flights', flightsRouter);
app.use('/api/maritime', maritimeRouter);
app.use('/api/geo', geoRouter);
app.use('/api/monitor', monitorRouter);
app.use('/api/cyber', cyberRouter);
app.use('/api/ar-crime', arCrimeRouter);
app.use('/api/cron', cronRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

export default app;
