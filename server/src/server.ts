import express, { Request, Response } from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.route';
import batchRoutes from './routes/batch.route';
import standardRoutes from './routes/standard.route';
import productRoutes from './routes/product.route'; 
import dashboardRoutes from './routes/dashboard.route';

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/batch', batchRoutes);
app.use('/standard', standardRoutes);
app.use('/product', productRoutes);
app.use('/dashboard', dashboardRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});