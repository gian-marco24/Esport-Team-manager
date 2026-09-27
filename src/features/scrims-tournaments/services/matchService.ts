import type { IMatchPort } from './matchPort';
import { FirebaseMatchAdapter } from './firebaseMatchAdapter';

export const matchService: IMatchPort = new FirebaseMatchAdapter();
