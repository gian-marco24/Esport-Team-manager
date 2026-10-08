import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { io, Socket } from 'socket.io-client';
import { db } from '../../../lib/firebase';
import type { TacticalBoardState } from '../types/tacticalBoard';

const STORAGE_PREFIX = 'urs_gamara_tactical_board_';

class TacticalBoardService {
  private socket: Socket | null = null;
  private activeVodId: string | null = null;
  private firestoreUnsubscribe: (() => void) | null = null;

  private getLocalState(vodId: string): TacticalBoardState | null {
    try {
      const data = localStorage.getItem(`${STORAGE_PREFIX}${vodId}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private saveLocalState(vodId: string, state: TacticalBoardState): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${vodId}`, JSON.stringify(state));
    } catch {
      // ignore
    }
  }

  /**
   * Conecta de forma manual y suscribe a las actualizaciones en tiempo real de la pizarra para la VOD dada.
   */
  connectAndSubscribe(
    vodId: string,
    onRemoteUpdate: (state: TacticalBoardState) => void
  ): () => void {
    this.disconnect();
    this.activeVodId = vodId;

    // 1. Cargar estado inicial local o remoto
    const localState = this.getLocalState(vodId);
    if (localState) {
      onRemoteUpdate(localState);
    }

    // 2. Suscripción en Tiempo Real con Firebase Firestore (Totalmente compatible con Vercel)
    if (db) {
      try {
        const boardDocRef = doc(db, 'tactical_boards', vodId);
        this.firestoreUnsubscribe = onSnapshot(
          boardDocRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data() as TacticalBoardState;
              this.saveLocalState(vodId, data);
              onRemoteUpdate(data);
            }
          },
          (err) => {
            console.warn('⚠️ Firestore onSnapshot notice (usando fallback local):', err.message);
          }
        );
      } catch (err) {
        console.warn('⚠️ Error al inicializar listener de Firestore para la pizarra:', err);
      }
    }

    // 3. Conexión opcional con Socket.io (para entornos con servidor Node.js dedicado)
    const backendUrl = import.meta.env.VITE_API_URL || '';
    if (backendUrl && !backendUrl.includes('vercel.app')) {
      try {
        this.socket = io(backendUrl, {
          transports: ['websocket', 'polling'],
          autoConnect: true,
          reconnectionAttempts: 3,
          timeout: 4000,
        });

        this.socket.on('connect', () => {
          this.socket?.emit('join-vod', vodId);
        });

        this.socket.on('tactical-board-remote-update', (data: TacticalBoardState) => {
          if (data && this.activeVodId === vodId) {
            this.saveLocalState(vodId, data);
            onRemoteUpdate(data);
          }
        });
      } catch (err) {
        console.warn('⚠️ Socket.io no disponible, operando mediante canal Firestore:', err);
      }
    }

    // Retorna función para desconexión limpia
    return () => {
      this.disconnect();
    };
  }

  /**
   * Guarda y propaga el estado de la pizarra a todos los integrantes en tiempo real.
   */
  async updateBoardState(vodId: string, state: TacticalBoardState): Promise<void> {
    const enrichedState: TacticalBoardState = {
      ...state,
      vodId,
      updatedAt: new Date().toISOString(),
    };

    // Guardar en local primero (cero latencia)
    this.saveLocalState(vodId, enrichedState);

    // Propagar por Socket.io si está conectado
    if (this.socket && this.socket.connected) {
      try {
        this.socket.emit('tactical-board-update', {
          vodId,
          boardData: enrichedState,
        });
      } catch {
        // ignore
      }
    }

    // Propagar por Firestore (Sincronización global en Vercel)
    if (db) {
      try {
        const boardDocRef = doc(db, 'tactical_boards', vodId);
        await setDoc(boardDocRef, enrichedState, { merge: true });
      } catch (err) {
        console.warn('⚠️ Error al guardar estado en Firestore:', err);
      }
    }
  }

  /**
   * Obtiene el estado guardado previamente para inicialización.
   */
  async getInitialState(vodId: string): Promise<TacticalBoardState | null> {
    const local = this.getLocalState(vodId);

    if (db) {
      try {
        const boardDocRef = doc(db, 'tactical_boards', vodId);
        const snap = await getDoc(boardDocRef);
        if (snap.exists()) {
          const data = snap.data() as TacticalBoardState;
          this.saveLocalState(vodId, data);
          return data;
        }
      } catch {
        // ignore
      }
    }

    return local;
  }

  /**
   * Cierra de forma inmediata todas las conexiones activas y limpia memoria.
   */
  disconnect(): void {
    if (this.firestoreUnsubscribe) {
      try {
        this.firestoreUnsubscribe();
      } catch {
        // ignore
      }
      this.firestoreUnsubscribe = null;
    }

    if (this.socket) {
      try {
        if (this.activeVodId) {
          this.socket.emit('leave-vod', this.activeVodId);
        }
        this.socket.disconnect();
      } catch {
        // ignore
      }
      this.socket = null;
    }

    this.activeVodId = null;
  }
}

export const tacticalBoardService = new TacticalBoardService();
