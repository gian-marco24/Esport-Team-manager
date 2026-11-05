import type { VodItem, VodAnnotation, VodMessage, CreateVodFormData } from '../types';
import type { User } from '../../auth/types';

export interface GetVodsResult {
  vods: VodItem[];
  hasMore: boolean;
}

export interface IVodPort {
  getVods(limitCount?: number): Promise<GetVodsResult>;
  getVodById(id: string): Promise<VodItem | null>;
  createVod(data: CreateVodFormData, author?: User): Promise<VodItem>;
  deleteVod(id: string): Promise<void>;

  getAnnotations(vodId: string): Promise<VodAnnotation[]>;
  createAnnotation(
    vodId: string,
    timestampSeconds: number,
    title: string,
    author: User,
    type?: 'annotation' | 'marker'
  ): Promise<VodAnnotation>;

  getMessages(annotationId: string): Promise<VodMessage[]>;
  sendMessage(
    annotationId: string,
    text: string,
    author: User,
    vodId?: string
  ): Promise<VodMessage>;
  subscribeToMessages(
    annotationId: string,
    callback: (messages: VodMessage[]) => void
  ): () => void;
}
