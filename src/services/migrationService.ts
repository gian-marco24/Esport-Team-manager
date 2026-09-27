import { doc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import type { Match } from '../features/scrims-tournaments/types';
import type { VodItem, VodAnnotation, VodMessage } from '../features/resources-vods/types';
import { uploadImageToBackend } from '../features/scrims-tournaments/services/uploadService';

const MOCK_MATCHES_KEY = 'urs_gamara_mock_matches';
const MOCK_VODS_KEY = 'urs_gamara_mock_vods';
const MOCK_ANNOTATIONS_KEY = 'urs_gamara_mock_annotations';
const MOCK_MESSAGES_KEY = 'urs_gamara_mock_messages';
const MIGRATION_DONE_KEY = 'urs_gamara_firebase_migrated_v2';

function base64ToFile(base64Data: string, filename: string): File {
  const arr = base64Data.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(arr[1] || arr[0]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

export async function migrateLocalStorageToFirestore(): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    console.info('Firestore is not available for migration.');
    return;
  }

  if (localStorage.getItem(MIGRATION_DONE_KEY) === 'true') {
    return;
  }

  console.log('🔄 Checking for local data to migrate to Firebase Firestore & Cloudinary...');

  try {
    // 1. Migrate Matches & Upload Base64 Screenshots
    const rawMatches = localStorage.getItem(MOCK_MATCHES_KEY);
    if (rawMatches) {
      const matches: Match[] = JSON.parse(rawMatches);
      for (const match of matches) {
        if (!match.id) continue;

        // Process base64 screenshots to Cloudinary / Backend upload
        const updatedScreenshots: string[] = [];
        if (match.screenshotUrls && match.screenshotUrls.length > 0) {
          for (let i = 0; i < match.screenshotUrls.length; i++) {
            const url = match.screenshotUrls[i];
            if (url && url.startsWith('data:image/')) {
              try {
                const file = base64ToFile(url, `screenshot-${match.id}-${i}.png`);
                const uploadedUrl = await uploadImageToBackend(file);
                if (uploadedUrl && (uploadedUrl.startsWith('http://') || uploadedUrl.startsWith('https://'))) {
                  updatedScreenshots.push(uploadedUrl);
                } else {
                  console.warn('Backend returned a non-HTTP response, skipping raw base64 data for Firestore document.');
                }
              } catch (e) {
                console.warn('Skipping base64 screenshot upload error during migration to prevent Firestore 1MB document limit:', e);
              }
            } else if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
              updatedScreenshots.push(url);
            }
          }
        }

        const finalMatch: Match = {
          ...match,
          screenshotUrls: updatedScreenshots,
        };

        await setDoc(doc(db, 'matches', match.id), finalMatch, { merge: true });
        console.log(`✅ Migrated match: ${finalMatch.opponentName} (${finalMatch.id})`);
      }
    }

    // 2. Migrate Standalone VODs
    const rawVods = localStorage.getItem(MOCK_VODS_KEY);
    if (rawVods) {
      const vods: VodItem[] = JSON.parse(rawVods);
      for (const vod of vods) {
        if (!vod.id) continue;
        await setDoc(doc(db, 'vods', vod.id), vod, { merge: true });
        console.log(`✅ Migrated VOD: ${vod.title} (${vod.id})`);
      }
    }

    // 3. Migrate Annotations & Markers
    const rawAnnotations = localStorage.getItem(MOCK_ANNOTATIONS_KEY);
    if (rawAnnotations) {
      const annotationsMap: Record<string, VodAnnotation[]> = JSON.parse(rawAnnotations);
      for (const [vodId, anns] of Object.entries(annotationsMap)) {
        for (const ann of anns) {
          if (!ann.id) continue;
          await setDoc(doc(db, 'vods', vodId, 'annotations', ann.id), ann, { merge: true });
        }
        console.log(`✅ Migrated ${anns.length} annotations for VOD ${vodId}`);
      }
    }

    // 4. Migrate Discussion Messages
    const rawMessages = localStorage.getItem(MOCK_MESSAGES_KEY);
    if (rawMessages) {
      const messagesMap: Record<string, VodMessage[]> = JSON.parse(rawMessages);
      for (const [annId, msgs] of Object.entries(messagesMap)) {
        for (const msg of msgs) {
          if (!msg.id) continue;
          await setDoc(doc(db, 'annotation_messages', annId, 'messages', msg.id), msg, { merge: true });
        }
        console.log(`✅ Migrated ${msgs.length} messages for annotation ${annId}`);
      }
    }

    // Mark migration as completed and clear local mock storage keys
    localStorage.setItem(MIGRATION_DONE_KEY, 'true');
    localStorage.removeItem(MOCK_MATCHES_KEY);
    localStorage.removeItem(MOCK_VODS_KEY);
    localStorage.removeItem(MOCK_ANNOTATIONS_KEY);
    localStorage.removeItem(MOCK_MESSAGES_KEY);

    console.log('🚀 Migration to Firebase Firestore & Cloudinary completed successfully!');
  } catch (error) {
    console.error('❌ Migration to Firestore error:', error);
  }
}
