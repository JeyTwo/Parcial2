import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import taskRoutes from './routes/task.routes';

const app = express();
const port = process.env.PORT || 3000;

app.use('/api/tasks', taskRoutes);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// Opciones de Swagger
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Management API',
      version: '1.0.0',
      description: 'API para gestionar tareas, integrando un servicio externo y Firebase.',
    },
    servers: [ { url: `http://localhost:${process.env.PORT || 3000}/api` } ], // Base path de tu API
    components: {
      schemas: {
        Task: { // Definición de tu modelo Task
          type: 'object',
          properties: {
            id: { type: 'string', example: 'taskId123_o_123' },
            title: { type: 'string', example: 'Hacer la compra' },
            completed: { type: 'boolean', example: false },
            userId: { type: 'integer', example: 1, nullable: true },
            source: { type: 'string', enum: ['external', 'firebase'], example: 'firebase' },
            createdAt: {type: 'string', format: 'date-time', example: '2024-06-01T12:00:00.000Z', nullable: true}
          },
        },
        NewTaskRequest: { // Modelo para el body de un POST
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', example: 'Nueva tarea desde Swagger' },
            completed: { type: 'boolean', example: false, default: false },
            userId: { type: 'integer', example: 1, description: 'Requerido si se crea en servicio externo compatible.' }
          }
        },
        UpdateTaskRequest: { // Modelo para el body de un PUT
          type: 'object',
          properties: {
            title: { type: 'string', example: 'Tarea actualizada' },
            completed: { type: 'boolean', example: true }
          }
        }
      }
    }
  },
  // Rutas a los archivos que contienen anotaciones OpenAPI (tus archivos de rutas)
  apis: ['./src/routes/*.ts', './src/models/*.ts'], // Ajusta las rutas según tu estructura
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec)); // Ruta para la UI de Swagger

// Monta tus rutas de API DESPUÉS de la configuración de Swagger UI si quieres que /api sea el base
app.use('/api/tasks', taskRoutes);

// ... (app.listen)