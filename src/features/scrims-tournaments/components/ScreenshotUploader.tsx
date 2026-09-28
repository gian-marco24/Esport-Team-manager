import React, { useState } from 'react';
import { Upload, Link as LinkIcon, X, Loader2, Sparkles, Scan } from 'lucide-react';
import { Input } from '../../../components/ui/Input';

interface ScreenshotUploaderProps {
  screenshotUrls: string[];
  isUploading?: boolean;
  maxAllowed?: number;
  isValorant?: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveScreenshot: (index: number) => void;
  onAddDirectUrl: (url: string) => void;
  onScanScreenshot?: (index: number) => void;
  error?: string;
}

export const ScreenshotUploader: React.FC<ScreenshotUploaderProps> = ({
  screenshotUrls = [],
  isUploading = false,
  maxAllowed = 5,
  isValorant = true,
  onFileChange,
  onRemoveScreenshot,
  onAddDirectUrl,
  onScanScreenshot,
  error,
}) => {
  const [tab, setTab] = useState<'file' | 'url'>('file');
  const [urlInput, setUrlInput] = useState('');

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onAddDirectUrl(urlInput.trim());
      setUrlInput('');
    }
  };

  const canAddMore = screenshotUrls.length < maxAllowed;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
            Capturas del Resultado ({screenshotUrls.length}/{maxAllowed})
          </label>
          {isValorant && (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#8B44F7]/20 border border-[#8B44F7]/50 rounded-full text-[10px] font-bold text-[#E2B86E]">
              <Sparkles className="w-3 h-3" />
              <span>OCR IA Habilitado</span>
            </span>
          )}
        </div>

        <div className="flex space-x-2 text-xs">
          <button
            type="button"
            onClick={() => setTab('file')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              tab === 'file'
                ? 'bg-[#8B44F7] text-white font-semibold'
                : 'bg-[#180d29] text-gray-400 hover:text-white'
            }`}
          >
            Subir Archivo
          </button>
          <button
            type="button"
            onClick={() => setTab('url')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              tab === 'url'
                ? 'bg-[#8B44F7] text-white font-semibold'
                : 'bg-[#180d29] text-gray-400 hover:text-white'
            }`}
          >
            URL Externa
          </button>
        </div>
      </div>

      {/* Grid of uploaded screenshots */}
      {screenshotUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {screenshotUrls.map((url, idx) => (
            <div
              key={idx}
              className="relative rounded-xl overflow-hidden border border-[#8B44F7]/40 bg-[#0D0914] h-36 flex justify-center items-center group shadow-md"
            >
              <img src={url} alt={`Captura ${idx + 1}`} className="object-cover w-full h-full" />
              
              {/* Delete button */}
              <button
                type="button"
                onClick={() => onRemoveScreenshot(idx)}
                className="absolute top-1.5 right-1.5 p-1 bg-red-950/80 border border-red-500 text-red-300 rounded-full hover:bg-red-900 transition-colors shadow-lg z-10"
                title="Quitar captura"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Scan OCR button (if Valorant) */}
              {isValorant && onScanScreenshot && (
                <button
                  type="button"
                  onClick={() => onScanScreenshot(idx)}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center space-y-1 transition-opacity text-white font-bold text-xs backdrop-blur-xs"
                >
                  <Scan className="w-6 h-6 text-[#E2B86E] animate-pulse" />
                  <span className="text-[#E2B86E] bg-[#26143E]/90 px-2 py-1 rounded-md border border-[#8B44F7]/60 text-[11px]">
                    Procesar con OCR
                  </span>
                </button>
              )}

              <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-black/70 text-[10px] text-[#E2B86E] font-bold rounded">
                Captura #{idx + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Uploader Input Box */}
      {canAddMore && (
        <>
          {isUploading ? (
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#8B44F7] rounded-xl bg-[#180d29]/80 space-y-2">
              <Loader2 className="w-6 h-6 text-[#E2B86E] animate-spin" />
              <p className="text-xs font-bold text-white">Subiendo y preparando captura...</p>
            </div>
          ) : tab === 'file' ? (
            <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-[#522B80]/60 hover:border-[#8B44F7] rounded-xl bg-[#180d29]/60 cursor-pointer transition-colors group">
              <div className="w-10 h-10 rounded-full bg-[#522B80]/40 flex items-center justify-center text-[#E2B86E] mb-1.5 group-hover:scale-110 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-gray-200">
                Haz clic para agregar captura {screenshotUrls.length + 1} de {maxAllowed}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {isValorant ? 'Al subir una captura de Valorant se abrirá el lector automático de KDA y rondas' : 'PNG, JPG, WEBP (vía Cloudinary)'}
              </p>
              <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
            </label>
          ) : (
            <div className="flex gap-2 items-center">
              <Input
                type="url"
                placeholder="https://res.cloudinary.com/..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                leftIcon={<LinkIcon className="w-4 h-4" />}
              />
              <button
                type="button"
                onClick={handleUrlSubmit}
                className="px-4 py-2.5 bg-[#522B80] hover:bg-[#8B44F7] text-white text-xs font-semibold rounded-lg shrink-0 transition-colors"
              >
                Agregar URL
              </button>
            </div>
          )}
        </>
      )}

      {error && <p className="text-xs text-red-400 font-medium">{error}</p>}
    </div>
  );
};
