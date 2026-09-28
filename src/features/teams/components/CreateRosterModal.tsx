import React, { useState, useEffect } from 'react';
import { X, ShieldPlus, Trophy, Info, AlertCircle, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { teamService } from '../services/teamService';
import { GAME_PRESETS } from '../types';
import { URS_GAMARA_TEAM } from '../config/currentTeam.config';
import { uploadImageToBackend } from '../../scrims-tournaments/services/uploadService';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';

interface CreateRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRosterCreated: () => void;
}

export const CreateRosterModal: React.FC<CreateRosterModalProps> = ({
  isOpen,
  onClose,
  onRosterCreated,
}) => {
  const [selectedGameId, setSelectedGameId] = useState<string>(GAME_PRESETS[0].id);
  const [customName, setCustomName] = useState<string>('');
  const [maxMainPlayers, setMaxMainPlayers] = useState<number>(GAME_PRESETS[0].defaultMainPlayers);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update default player count when game selection changes
  useEffect(() => {
    const preset = GAME_PRESETS.find((g) => g.id === selectedGameId);
    if (preset) {
      setMaxMainPlayers(preset.defaultMainPlayers);
    }
  }, [selectedGameId]);

  if (!isOpen) return null;

  const currentGamePreset = GAME_PRESETS.find((g) => g.id === selectedGameId) || GAME_PRESETS[0];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const url = await uploadImageToBackend(file);
      setLogoUrl(url);
    } catch (uploadErr) {
      // Fallback to Data URL for instant preview if backend server is not running
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
      return;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const defaultName = `${URS_GAMARA_TEAM.name} - ${currentGamePreset.name}`;
      const finalName = customName.trim() ? customName.trim() : defaultName;

      await teamService.createRoster(URS_GAMARA_TEAM.id, {
        name: finalName,
        game: currentGamePreset.name,
        maxMainPlayers,
        logoUrl: logoUrl.trim() || undefined,
      });

      onRosterCreated();
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Error al crear el roster.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#140b21] border border-[#522B80] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#26143E] flex items-center justify-between bg-[#1d0f30]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#522B80]/60 border border-[#8B44F7]/40 flex items-center justify-center text-[#E2B86E]">
              <ShieldPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-wide">Crear Nuevo Roster</h3>
              <p className="text-xs text-gray-400">Configura una escuadra oficial para competir en un juego</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-lg flex items-start space-x-2 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Select
            label="Juego / E-Sport"
            leftIcon={<Trophy className="w-4 h-4 text-[#E2B86E]" />}
            value={selectedGameId}
            onChange={(e) => setSelectedGameId(e.target.value)}
          >
            {GAME_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id} className="bg-[#140b21] text-white">
                {preset.name} ({preset.defaultMainPlayers} Titulares)
              </option>
            ))}
          </Select>

          <Input
            label="Nombre del Roster (Opcional)"
            type="text"
            placeholder={`Por defecto: "${URS_GAMARA_TEAM.name} - ${currentGamePreset.name}"`}
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            helperText="Si lo dejas en blanco se usará el formato predefinido: El equipo - Juego"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-[#26143E]/50 border border-[#8B44F7]/20 rounded-xl space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Titulares</span>
              <span className="text-lg font-black text-[#E2B86E]">{maxMainPlayers} Jugadores</span>
            </div>

            <div className="p-3 bg-[#26143E]/50 border border-[#8B44F7]/20 rounded-xl space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Suplentes Max</span>
              <span className="text-lg font-black text-purple-300">Hasta 3</span>
            </div>

            <div className="p-3 bg-[#26143E]/50 border border-[#8B44F7]/20 rounded-xl space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Coaches Max</span>
              <span className="text-lg font-black text-amber-300">0 a 3</span>
            </div>
          </div>

          {selectedGameId === 'custom' && (
            <Input
              label="Cantidad de Players Titulares"
              type="number"
              min={1}
              max={10}
              value={maxMainPlayers}
              onChange={(e) => setMaxMainPlayers(Number(e.target.value))}
            />
          )}

          {/* Cloudinary Logo Upload Section */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
              Logo del Roster (Subida a Cloudinary)
            </label>

            {logoUrl ? (
              <div className="p-3 bg-[#180d29] border border-[#8B44F7]/40 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img src={logoUrl} alt="Preview Logo" className="w-12 h-12 rounded-xl object-contain bg-[#0D0914] p-1 border border-[#522B80]" />
                  <div>
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5" /> Logo procesado
                    </span>
                    <p className="text-[10px] text-gray-400 truncate max-w-[200px]">{logoUrl}</p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setLogoUrl('')}
                  leftIcon={<Trash2 className="w-4 h-4 text-red-400" />}
                >
                  Quitar
                </Button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-[#522B80]/80 hover:border-[#8B44F7] bg-[#180d29]/60 hover:bg-[#180d29] rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group">
                <Upload className="w-6 h-6 text-[#E2B86E] mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-white">
                  {isUploading ? 'Procesando y subiendo logo...' : 'Seleccionar imagen para el Roster'}
                </span>
                <span className="text-[10px] text-gray-400 mt-0.5">Se guardará y procesará en Cloudinary</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="p-3 bg-[#1d0f30] border border-[#522B80]/40 rounded-xl text-xs text-gray-400 flex items-start space-x-2">
            <Info className="w-4 h-4 text-[#8B44F7] shrink-0 mt-0.5" />
            <span>
              Una vez creado, podrás asignar jugadores titulares, suplentes, Head Coach y coaches asistentes desde la tabla de integrantes.
            </span>
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="secondary" isLoading={isSubmitting || isUploading}>
              Crear Escuadra
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
