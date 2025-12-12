import express, { Express } from 'express';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { loggingMiddleware } from './middleware/logging';

const app: Express = express();

app.use(express.json());
app.use(loggingMiddleware);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/v1', routes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use(errorHandler);

export default app;
