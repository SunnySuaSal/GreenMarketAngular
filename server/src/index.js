import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { connectDb } from './db/connect.js';
import { productsRouter } from './routes/products.js';
import { ordersRouter } from './routes/orders.js';

const PORT = Number(process.env.PORT) || 4000;
const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/greenmarket';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'greenmarket-api' });
});

app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status ?? 500;
  const message = err.message ?? 'Error interno';
  res.status(status).json({ message });
});

await connectDb(MONGODB_URI);
app.listen(PORT, () => {
  console.log(`API GreenMarket en http://localhost:${PORT} (MongoDB conectado)`);
});
