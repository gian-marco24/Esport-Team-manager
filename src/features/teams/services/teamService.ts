import type { ITeamPort } from './teamPort';
import { FirebaseTeamAdapter } from './firebaseTeamAdapter';

export const teamService: ITeamPort = new FirebaseTeamAdapter();
