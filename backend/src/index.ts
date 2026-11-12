import express from 'express';
import cors from 'cors';
import { config } from './config';
import { getDb } from './db/schema';
import { chatRouter } from './routes/chat';
import { sessionsRouter } from './routes/sessions';

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  }),
);
app.use(express.json({ limit: '1mb' }));

// ── Init DB ───────────────────────────────────────────────────────────────────

getDb(); // creates tables on first run

// ── Routes ────────────────────────────────────────────────────────────────────

app.use('/api/chat', chatRouter);
app.use('/api/sessions', sessionsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', model: config.model, port: config.port });
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(config.port, () => {
  console.log(`\n🚀  Backend running  →  http://localhost:${config.port}`);
  console.log(`🤖  Model            →  ${config.model}`);
  console.log(`📦  Database         →  ${config.dbPath}\n`);
});
