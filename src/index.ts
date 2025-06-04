import express from 'express';
import taskRoutes from './routes/task.routes';

const app = express();
const port = process.env.PORT || 3000;

app.use('/api/tasks', taskRoutes);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});