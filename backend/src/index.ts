import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import './models/User'

// 1. Load environment variables from a .env file (if one exists)
dotenv.config();

// 2. Initialize the Express application
const app = express();
const PORT = process.env.PORT || 5000;

// 3. Middlewares:
// Allow requests from other origins (like our Next.js frontend on localhost:3000)
app.use(cors());
// Automatically parse incoming JSON data in request bodies
app.use(express.json());

// 4. A simple test route (health check)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Al-Muallim V2 Express API is running smoothly!'
  });
});

// 5. Start listening for incoming connections
app.listen(PORT, async () => {
  await connectDB();
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
