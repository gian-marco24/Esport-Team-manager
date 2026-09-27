import type { IAuthPort } from './authPort';
import { FirebaseAuthAdapter } from './firebaseAuthAdapter';

export const authService: IAuthPort = new FirebaseAuthAdapter();
