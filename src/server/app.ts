import express from 'express';
import sitesRouter from './routes/sites';

const app = express();

app.use(express.json());
app.use(sitesRouter);

export default app;
