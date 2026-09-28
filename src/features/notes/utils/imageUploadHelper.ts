import { uploadImageToBackend } from '../../scrims-tournaments/services/uploadService';

/**
 * Upload an image file. Tries backend Cloudinary upload first,
 * and seamlessly falls back to base64 Data URL if backend is unavailable.
 */
export const uploadTacticalImage = async (file: File): Promise<string> => {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Solo se permiten archivos de imagen (PNG, JPG, WEBP, GIF)');
  }

  // Size limit: 8MB
  if (file.size > 8 * 1024 * 1024) {
    throw new Error('La imagen no debe superar los 8MB');
  }

  try {
    const url = await uploadImageToBackend(file);
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      return url;
    }
  } catch (err) {
    console.warn('Backend Cloudinary upload failed, falling back to local base64:', err);
  }

  // Fallback to Base64 Data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Error al procesar la imagen'));
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo de imagen'));
    reader.readAsDataURL(file);
  });
};
