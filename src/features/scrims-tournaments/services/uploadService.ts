import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_API || 'http://localhost:5000';

export interface UploadImageResponse {
  success: boolean;
  url: string;
  public_id?: string;
  message?: string;
}

export const uploadImageToBackend = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await axios.post<UploadImageResponse>(
      `${BACKEND_URL}/api/upload/image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (response.data && response.data.url && (response.data.url.startsWith('http://') || response.data.url.startsWith('https://'))) {
      return response.data.url;
    }

    throw new Error(response.data.message || 'Error al obtener la URL de Cloudinary.');
  } catch (error: any) {
    console.error('Backend image upload error:', error);
    const msg =
      error?.response?.data?.message ||
      error?.message ||
      'Error de red al subir la imagen. Verifica que el servidor backend esté en ejecución y Cloudinary configurado.';
    throw new Error(msg);
  }
};
