import type { INotesPort } from './notesPort';
import { FirebaseNotesAdapter } from './firebaseNotesAdapter';

export const notesService: INotesPort = new FirebaseNotesAdapter();
