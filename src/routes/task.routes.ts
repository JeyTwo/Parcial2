import express, { Request, Response } from 'express';
import * as todoClient from '../services/todoClient.service';


const router = express.Router();
router.use(express.json()); // Middleware para parsear JSON bodies

// GET /api/tasks (solo del servicio externo por ahora)
router.get('/', async (req: Request, res: Response) => {
  try {
    const tasks = await todoClient.getAllExternalTasks();
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching external tasks:', error);
    res.status(500).json({ message: 'Failed to fetch tasks from external service' });
  }
});

// POST /api/tasks (solo al servicio externo por ahora)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, completed, userId } = req.body;
    if (!title || userId === undefined) { // userId es requerido por JSONPlaceholder
      return res.status(400).json({ message: 'Title and userId are required' });
    }
    const newTask = await todoClient.createExternalTask({ title, completed: completed || false, userId });
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating external task:', error);
    res.status(500).json({ message: 'Failed to create task on external service' });
  }
});

// PUT /api/tasks/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
        return res.status(400).json({ message: 'Invalid task ID format' });
    }
    const updatedTask = await todoClient.updateExternalTask(taskId, req.body);
    res.status(200).json(updatedTask);
  } catch (error) {
    console.error('Error updating external task:', error);
    if (axios.isAxiosError(error) && error.response?.status === 404) {
        return res.status(404).json({ message: 'External task not found' });
    }
    res.status(500).json({ message: 'Failed to update task on external service' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
        return res.status(400).json({ message: 'Invalid task ID format' });
    }
    await todoClient.deleteExternalTask(taskId);
    res.status(204).send(); // No content
  } catch (error) {
    console.error('Error deleting external task:', error);
    if (axios.isAxiosError(error) && error.response?.status === 404) {
        // JSONPlaceholder delete devuelve {} y status 200, no 404 si no existe.
        // Esto es más un manejo genérico.
        return res.status(404).json({ message: 'External task not found or already deleted' });
    }
    res.status(500).json({ message: 'Failed to delete task on external service' });
  }
});

export default router;