import React, { useState } from 'react';
import { X, UserCheck, AlertCircle, Info, Edit3, Tag } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

interface EditNicknameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNick: string;
  currentGameTag?: string;
  onSave: (newNick: string, newGameTag?: string) => Promise<void>;
}

export const EditNicknameModal: React.FC<EditNicknameModalProps> = ({
  isOpen,
  onClose,
  currentNick,
  currentGameTag,
  onSave,
}) => {
  const [nick, setNick] = useState(currentNick || '');
  const [gameTag, setGameTag] = useState(currentGameTag || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when opened
  React.useEffect(() => {
    if (isOpen) {
      setNick(currentNick || '');
      setGameTag(currentGameTag || '');
      setError(null);
    }
  }, [isOpen, currentNick, currentGameTag]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNick = nick.trim();
    const cleanTag = gameTag.trim();

    if (!cleanNick) {
      setError('El nickname no puede estar vacío.');
      return;
    }

    if (cleanNick.length < 2) {
      setError('El nickname debe tener al menos 2 caracteres.');
      return;
    }

    if (cleanNick.length > 25) {
      setError('El nickname no puede exceder los 25 caracteres.');
      return;
    }

    if (cleanTag && !cleanTag.startsWith('#') && cleanTag.length > 0) {
      // Automatically add # if user omitted it
      // but let's format it nicely
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const formattedTag = cleanTag
        ? cleanTag.startsWith('#')
          ? cleanTag
          : `#${cleanTag}`
        : undefined;

      await onSave(cleanNick, formattedTag);
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Error al actualizar el nickname.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#140b21] border border-[#522B80] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#26143E] flex items-center justify-between bg-[#1d0f30]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#522B80]/60 border border-[#8B44F7]/40 flex items-center justify-center text-[#E2B86E]">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-wide">Editar Nickname & Tag</h3>
              <p className="text-xs text-gray-400">Actualiza tu identidad competitiva en URS Gamara</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#26143E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-lg flex items-start space-x-2 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Nickname Oficial"
            type="text"
            placeholder="Ej: Zeyn, TenZ, Shroud..."
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            required
            helperText="Tu nombre visible en la plataforma, rosters y tablas de estadísticas."
          />

          <Input
            label="Tag de Juego (Opcional)"
            type="text"
            leftIcon={<Tag className="w-4 h-4 text-[#E2B86E]" />}
            placeholder="Ej: #LAN, #LAS, #1234"
            value={gameTag}
            onChange={(e) => setGameTag(e.target.value)}
            helperText="Tag del juego para emparejamiento OCR en partidas y scrims."
          />

          <div className="p-3 bg-[#1d0f30] border border-[#522B80]/40 rounded-xl text-xs text-gray-400 flex items-start space-x-2">
            <Info className="w-4 h-4 text-[#8B44F7] shrink-0 mt-0.5" />
            <span>
              Al cambiar tu nick, se actualizará instantáneamente en tu perfil, la barra lateral y en los reportes del equipo.
            </span>
          </div>

          <div className="pt-3 flex items-center justify-end space-x-3">
            <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="secondary"
              isLoading={isSubmitting}
              leftIcon={<UserCheck className="w-4 h-4" />}
            >
              Guardar Nickname
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
