import express from 'express';
import "dotenv/config";
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL,
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json({
    limit: "10mb"
}));
app.use(express.urlencoded({
    extended: true,
    limit: "10mb"
}));
app.use(cookieParser());
app.use(express.static('public'));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: (req: any) => (req.user ? 1000 : 100),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => ipKeyGenerator(req)
});

app.use(limiter);


import userRoutes from './routes/user.route';
import { errorHandler } from './middlewares/error.middleware';

app.use('/api/users', userRoutes);



app.use(errorHandler);

export default app;

