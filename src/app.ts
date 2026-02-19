import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import workspaceRoutes from './routes/workspaceRoutes.js';
import userRoutes from './routes/userRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import postRoutes from './routes/postRoutes.js';
import dayPassRoutes from './routes/dayPassRoutes.js';





const app: Express = express();

app.use(cors({
    origin: "*"
}));
app.use(express.json());

// Request logger middleware
app.use((req: any, res: any, next: any) => {
    console.log(`\x1b[36m%s\x1b[0m`, `[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// Health check route
app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', message: 'Backend is running' });
});

// Resource routes
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/daypass', dayPassRoutes);


// Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

export default app;
