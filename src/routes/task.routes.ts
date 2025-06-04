import express, { Request, Response } from 'express';
import * as todoClient from '../services/todoClient.service';
import * as firebaseService from '../services/firebase.service';


const router = express.Router();
router.use(express.json()); // Middleware para parsear JSON bodies

// GET /api/tasks (solo del servicio externo por ahora)
router.get('/', async (req: Request, res: Response) => {
  try {
    const [externalTasks, firebaseTasks] = await Promise.all([
      todoClient.getAllExternalTasks().catch(err => {
        console.error("Error fetching external tasks, returning empty array for them.", err);
        return []; // Devuelve un array vacío si falla para no romper toda la respuesta
      }),
      firebaseService.getAllFirebaseTasks().catch(err => {
        console.error("Error fetching firebase tasks, returning empty array for them.", err);
        return []; // Devuelve un array vacío si falla
      })
    ]);

    // Lógica de mezcla y deduplicación
    // Un Map puede ayudar a evitar duplicados si hay una propiedad común (ej. 'title')
    // o si guardaste un `externalId` en tus tareas de Firebase.
    // Por ahora, una simple concatenación, asumiendo que los IDs son diferentes
    // y que la `source` ayuda a distinguirlos.
    // Si los IDs pudieran colisionar o si necesitas una deduplicación más inteligente:
    const tasksMap = new Map<string, Task>();

    externalTasks.forEach(task => {
        // Si los IDs son números, conviértelos a string para la clave del Map
        // O usa una clave compuesta si el ID no es suficiente (ej: `external-${task.id}`)
        tasksMap.set(`external-${task.id}`, task);
    });

    firebaseTasks.forEach(task => {
        // Aquí la lógica de duplicados es crucial.
        // ¿Cómo sabes si una tarea de Firebase es la "misma" que una externa?
        // 1. Si al guardar en Firebase guardaste el `externalId`.
        // 2. Si comparas por `title` (puede ser impreciso).
        // Asumamos que son distintas por ahora, o que el ID de Firestore es único.
        tasksMap.set(`firebase-${task.id}`, task);
    });

    const mergedTasks = Array.from(tasksMap.values());
    res.status(200).json(mergedTasks);

  } catch (error) {
    console.error('Error fetching and merging tasks:', error);
    res.status(500).json({ message: 'Failed to fetch and merge tasks' });
  }
});


// POST /api/tasks (solo al servicio externo por ahora)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, completed, userId } = req.body; // userId podría ser opcional para Firebase
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    let externalTaskResponse: Task | null = null;
    // Intenta crear en el servicio externo si es parte del flujo
    // Aquí asumimos que el servicio externo necesita userId, y Firestore no necesariamente.
    if (userId !== undefined) {
        try {
            externalTaskResponse = await todoClient.createExternalTask({ title, completed: completed || false, userId });
        } catch (externalError) {
            console.warn('Failed to create task on external service, proceeding with Firestore only for this POST.', externalError);
            // Decide si esto debe ser un error 500 o si la app puede continuar.
            // return res.status(500).json({ message: 'Failed to create task on external service during dual save.' });
        }
    }


    // Guarda en Firestore
    const firestoreTaskData = { title, completed: completed || false };
    // Si quieres asociar el userId en Firestore también:
    // const firestoreTaskData = { title, completed: completed || false, userId };
    const savedToFirestoreTask = await firebaseService.saveTaskToFirestore(firestoreTaskData);

    // Decide qué devolver. Podría ser la tarea de Firestore, la externa, o un combinado.
    // Por ahora, devolvemos la de Firestore y un mensaje si la externa falló.
    const responsePayload: any = { firestoreTask: savedToFirestoreTask };
    if (externalTaskResponse) {
        responsePayload.externalTask = externalTaskResponse;
    } else if (userId !== undefined) {
        responsePayload.externalTaskMessage = "Failed to create on external service.";
    }

    res.status(201).json(responsePayload);

  } catch (error) {
    console.error('Error processing POST /api/tasks:', error);
    res.status(500).json({ message: 'Failed to create task' });
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