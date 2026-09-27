import type { IVodPort } from './vodPort';
import { FirebaseVodAdapter } from './firebaseVodAdapter';

export const vodService: IVodPort = new FirebaseVodAdapter();
