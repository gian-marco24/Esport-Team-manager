import React, { useEffect } from 'react';
import { X, ExternalLink, Download } from 'lucide-react';

interface ImageLightboxModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({ imageUrl, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Actions Bar */}
        <div className="w-full flex items-center justify-between pb-3 text-white">
          <span className="text-xs text-gray-300 font-medium tracking-wide">
            Vista Previa de Imagen Táctica
          </span>

          <div className="flex items-center space-x-2">
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-[#26143E]/80 hover:bg-[#522B80] rounded-lg text-gray-300 hover:text-white transition-colors"
              title="Abrir en pestaña nueva"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href={imageUrl}
              download="estrategia_tactica.png"
              className="p-2 bg-[#26143E]/80 hover:bg-[#522B80] rounded-lg text-gray-300 hover:text-white transition-colors"
              title="Descargar imagen"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 bg-red-950/60 hover:bg-red-900 border border-red-500/40 rounded-lg text-red-300 hover:text-white transition-colors"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Full Image */}
        <div className="relative rounded-2xl overflow-hidden border border-[#522B80] shadow-2xl bg-[#0D0914] max-h-[80vh] flex items-center justify-center">
          <img
            src={imageUrl}
            alt="Estrategia ampliada"
            className="max-h-[80vh] max-w-full object-contain rounded-xl"
          />
        </div>
      </div>
    </div>
  );
};
