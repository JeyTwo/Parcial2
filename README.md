Mini-Aplicación de Gestión de Tareas
Esta es una mini-aplicación de gestión de tareas desarrollada como parte de un parcial. Integra el consumo de un servicio externo (JSONPlaceholder), persistencia en la nube con Firebase Cloud Firestore, documentación de API con Swagger y está preparada para ser ejecutada en contenedores Docker.

Características Principales (Hasta Parte D)
API de Tareas: Endpoints para operaciones CRUD (Crear, Leer, Actualizar, Eliminar) sobre tareas.

Consumo de Servicio Externo: Interactúa con JSONPlaceholder para obtener y manipular tareas externas.

Integración con Firebase:

Persiste las tareas creadas en una colección tasks en Cloud Firestore.

Al listar tareas, combina los datos del servicio externo y los de Firestore.

Documentación de API: Interfaz de Swagger UI disponible para explorar y probar la API.

Dockerización: Incluye Dockerfile para construir una imagen de producción y docker-compose.yml opcional para orquestar la aplicación y un emulador de Firestore.

Requisitos Previos
Node.js (v18 o superior recomendado)

npm (o yarn)

Git

Docker (para la ejecución en contenedor)

Docker Compose (opcional, si se usa el docker-compose.yml)

Una cuenta de Firebase y un proyecto con Cloud Firestore habilitado.

Configuración del Proyecto
Clonar el repositorio:

git clone <URL_DEL_REPOSITORIO>
cd task-manager-app

Instalar dependencias:

npm install

Configuración de Firebase (MUY IMPORTANTE):

Esta aplicación utiliza Firebase Admin SDK para interactuar con Cloud Firestore. NUNCA DEBES SUBIR TUS CREDENCIALES DE FIREBASE (archivo serviceAccountKey.json) A TU REPOSITORIO GIT.

Tienes varias opciones para configurar las credenciales para ejecución local y en Docker:

Opción 1: Archivo de Clave de Servicio (Desarrollo Local)

Ve a tu proyecto en Firebase Console.

Navega a "Configuración del proyecto" > "Cuentas de servicio".

Haz clic en "Generar nueva clave privada" y descarga el archivo JSON.

Guarda este archivo en una ubicación segura FUERA de tu repositorio Git. Por ejemplo, en la raíz del proyecto pero asegúrate de que esté listado en tu .gitignore.

Crea un archivo .env en la raíz de tu proyecto con la siguiente variable, apuntando a la ruta de tu clave (ajusta la ruta según donde lo guardaste):

# .env (Asegúrate que este archivo esté en .gitignore)
GOOGLE_APPLICATION_CREDENTIALS="./path/to/your/serviceAccountKey.json"
PORT=3000

La aplicación cargará estas variables usando dotenv (necesitarás instalarlo: npm install dotenv y configurarlo en tu src/index.ts o un archivo de configuración).

Opción 2: Variables de Entorno para Docker (Recomendado para Contenedores)
Cuando ejecutes con Docker, es mejor pasar las credenciales como variables de entorno directamente al contenedor. Puedes pasar el contenido completo del JSON de la clave de servicio como una variable de entorno (GOOGLE_APPLICATION_CREDENTIALS_JSON) o las partes individuales si tu SDK lo soporta (project_id, private_key, client_email). El Dockerfile y docker-compose.yml están preparados para esto.

Ejecución Local
Asegúrate de haber completado la Configuración del Proyecto, especialmente las credenciales de Firebase.

Compilar TypeScript (si has hecho cambios en el código .ts):

npm run build

Iniciar el servidor en modo desarrollo (con recarga automática):

npm run dev

La aplicación estará disponible en http://localhost:3000 (o el puerto que hayas configurado en PORT).
La API de tareas estará en http://localhost:3000/api/tasks.
La UI de Swagger (una vez implementada en la Parte C) estará en http://localhost:3000/api-docs.

Iniciar el servidor en modo producción (usa el código compilado en dist/):

npm start

Ejecución con Docker
1. Construir la Imagen Docker
Desde la raíz del proyecto, donde se encuentra el Dockerfile:

docker build -t tu-app-tareas .

(Reemplaza tu-app-tareas con el nombre que prefieras para tu imagen).

2. Ejecutar el Contenedor (sin Docker Compose)
Para ejecutar el contenedor directamente, necesitarás pasar las variables de entorno para Firebase.

Método A: Pasando el contenido del JSON de la clave de servicio:
Obtén el contenido de tu serviceAccountKey.json y pásalo como una variable de entorno. Puede ser una cadena larga.

# Asegúrate de escapar correctamente los caracteres especiales si es necesario, o ponlo en una sola línea.
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type": "service_account", "project_id": "tu-proyecto-id", ...resto del json...}' \
  tu-app-tareas

Método B: Montando el archivo de clave de servicio (menos seguro para algunas configuraciones, pero útil para desarrollo):
Si tu serviceAccountKey.json está en ./firebase-keys/serviceAccountKey.json:

docker run -p 3000:3000 \
  -v $(pwd)/firebase-keys/serviceAccountKey.json:/usr/src/app/serviceAccountKey.json:ro \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e GOOGLE_APPLICATION_CREDENTIALS="/usr/src/app/serviceAccountKey.json" \
  tu-app-tareas

(Asegúrate que la ruta interna /usr/src/app/serviceAccountKey.json coincida con cómo la lee tu aplicación dentro del contenedor o cómo la espera el SDK de Firebase Admin).

3. Ejecutar con Docker Compose (Opcional - Parte D.2)
Si has configurado el docker-compose.yml, puedes levantar la aplicación (y el emulador de Firestore si está configurado) más fácilmente.

Configurar variables de entorno para Docker Compose:
docker-compose puede leer variables de un archivo .env en la raíz del proyecto. Crea o modifica tu archivo .env para incluir las variables necesarias para el servicio app en docker-compose.yml.

Ejemplo de .env para docker-compose:

# .env (para docker-compose)
APP_PORT_HOST=3000
FIRESTORE_EMULATOR_PORT_HOST=8085 # Si usas el emulador
NODE_ENV=development # o production

# Opción para credenciales de Firebase (si no usas el emulador para todo)
# GOOGLE_APPLICATION_CREDENTIALS_JSON='{...tu json ...}'
# O, si montas el archivo vía 'secrets' en docker-compose.yml:
# Asegúrate que la sección 'secrets' en docker-compose.yml apunte a tu archivo local.

Levantar los contenedores:

docker-compose up

Para reconstruir la imagen si has hecho cambios en el Dockerfile o el código fuente:

docker-compose up --build

Para detener los contenedores:

docker-compose down

La aplicación estará accesible en el puerto que hayas mapeado en docker-compose.yml (ej. http://localhost:3000).

Estructura del Proyecto (src/)
index.ts: Punto de entrada de la aplicación Express.

models/: Contiene las definiciones de modelos/interfaces (ej. task.model.ts).

services/: Lógica de negocio y comunicación con servicios externos o bases de datos.

todoClient.service.ts: Cliente para el servicio externo de tareas (JSONPlaceholder).

firebase.service.ts: Servicio para interactuar con Firebase Firestore.

routes/: Define los endpoints de la API (ej. task.routes.ts).

config/: (Opcional) Archivos de configuración, como la inicialización de Swagger.

Endpoints de la API (Base: /api)
GET /tasks: Obtiene una lista de tareas.

POST /tasks: Crea una nueva tarea.

PUT /tasks/:id: Actualiza una tarea existente por su ID.

DELETE /tasks/:id: Elimina una tarea por su ID.

(Más detalles estarán disponibles en la UI de Swagger una vez implementada).