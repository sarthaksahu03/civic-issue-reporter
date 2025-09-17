import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import grievanceRoutes from './routes/grievances.js';
import userRoutes from './routes/user.js';
import dashboardRoutes from './routes/dashboard.js';
import adminRoutes from './routes/admin.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/grievances', grievanceRoutes);
app.use('/api/user', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.send('Civic Issue Reporter Backend is running.');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
