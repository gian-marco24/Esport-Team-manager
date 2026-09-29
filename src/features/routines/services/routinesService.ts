import { FirebaseRoutinesAdapter } from './firebaseRoutinesAdapter';
import type { IRoutinesPort } from './routinesPort';

export const routinesService: IRoutinesPort = new FirebaseRoutinesAdapter();
