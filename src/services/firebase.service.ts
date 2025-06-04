import * as admin from 'firebase-admin';
import { Task } from '../models/task.model';

// Carga las credenciales (¡mejor con variables de entorno!)
// Ejemplo: process.env.GOOGLE_APPLICATION_CREDENTIALS apunta al path del JSON
// o parsea un JSON string desde process.env.FIREBASE_CONFIG_JSON
try {
    // Opción A: Ruta al archivo JSON (usar variable de entorno para la ruta)
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!serviceAccountPath) {
        throw new Error('GOOGLE_APPLICATION_CREDENTIALS env var not set.');
    }
    const serviceAccount = require(serviceAccountPath); // Asegúrate que la ruta sea correcta
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized with service account file.');

} catch (e) {
    console.warn("Could not initialize Firebase with service account file, trying Application Default Credentials (ADC)...", e);
    // Opción B: Application Default Credentials (para entornos como Cloud Run, GKE, etc.)
    // o si `gcloud auth application-default login` se ejecutó localmente.
    try {
        admin.initializeApp();
        console.log('Firebase Admin initialized with Application Default Credentials.');
    } catch (adcError) {
        console.error("Failed to initialize Firebase Admin with ADC:", adcError);
        // Considera una Opción C aquí si es necesario, como variables de entorno directas para project_id, private_key, client_email
    }
}


const db = admin.firestore();
const tasksCollection = db.collection('tasks');

export async function saveTaskToFirestore(taskData: Omit<Task, 'id' | 'source'>): Promise<Task> {
  const docRef = await tasksCollection.add({ ...taskData, createdAt: admin.firestore.FieldValue.serverTimestamp() });
  return {
    id: docRef.id, // Firestore genera el ID
    ...taskData,
    source: 'firebase'
  };
}

export async function getAllFirebaseTasks(): Promise<Task[]> {
  const snapshot = await tasksCollection.orderBy('createdAt', 'desc').get();
  if (snapshot.empty) {
    return [];
  }
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<Task, 'id' | 'source'>), // Asegúrate que el tipo coincida
    source: 'firebase'
  }));
}

// Podrías añadir getFirebaseTaskById, updateFirebaseTask, deleteFirebaseTask si los necesitas
// para interactuar directamente con Firebase desde otros endpoints o lógicas.