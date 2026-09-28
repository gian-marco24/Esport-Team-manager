import React, { useState } from 'react';
import { X, UserPlus, Copy, Check, Clock, Sparkles, AlertCircle } from 'lucide-react';
import { teamService } from '../services/teamService';
import type { TeamRole, Invitation } from '../types';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { URS_GAMARA_TEAM } from '../config/currentTeam.config';

interface GenerateInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInviteGenerated?: () => void;
}

const ROLES: TeamRole[] = [
  'Player',
  'Coach',
  'Manager',
  'Creador de contenido',
  'Staff',
];

export const GenerateInviteModal: React.FC<GenerateInviteModalProps> = ({
  isOpen,
  onClose,
  onInviteGenerated,
}) => {
  const [nick, setNick] = useState('');
  const [teamRole, setTeamRole] = useState<TeamRole>('Player');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedInvite, setGeneratedInvite] = useState<Invitation | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nick.trim()) {
      setError('Por favor ingresa el Nick del usuario.');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const inv = await teamService.createInvitation(URS_GAMARA_TEAM.id, {
        nick: nick.trim(),
        teamRole,
      });

      setGeneratedInvite(inv);
      if (onInviteGenerated) onInviteGenerated();
    } catch (err) {
      setError((err as Error).message || 'Error al generar enlace de invitación.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getFullInviteUrl = (code: string) => {
    return `${window.location.origin}/register?code=${code}`;
  };

  const handleCopy = () => {
    if (!generatedInvite) return;
    const url = getFullInviteUrl(generatedInvite.code);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleReset = () => {
    setNick('');
    setTeamRole('Player');
    setGeneratedInvite(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#140b21] border border-[#522B80] rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#26143E] flex items-center justify-between bg-[#1d0f30]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#522B80]/60 border border-[#8B44F7]/40 flex items-center justify-center text-[#E2B86E]">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-wide">Generar Enlace de Invitación</h3>
              <p className="text-xs text-gray-400">Invita a un nuevo integrante al equipo URS Gamara</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#26143E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-lg flex items-start space-x-2 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!generatedInvite ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              <Input
                label="Nickname del Usuario a añadir"
                type="text"
                placeholder="ej. GamaraFlex"
                value={nick}
                onChange={(e) => setNick(e.target.value)}
                required
              />

              <Select
                label="Rol en el Equipo"
                value={teamRole}
                onChange={(e) => setTeamRole(e.target.value as TeamRole)}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role} className="bg-[#140b21] text-white">
                    {role}
                  </option>
                ))}
              </Select>

              <div className="p-3 bg-[#26143E]/40 border border-[#8B44F7]/20 rounded-xl text-xs text-gray-400 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-[#E2B86E] shrink-0" />
                <span>
                  El enlace generado tendrá una validez única de <strong>30 minutos</strong> por seguridad.
                </span>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <Button variant="ghost" type="button" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="secondary"
                  isLoading={isGenerating}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                >
                  Generar Link Privado
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 bg-[#26143E]/60 border border-[#8B44F7]/40 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-medium">Nickname: <strong className="text-white">{generatedInvite.nick}</strong></span>
                  <span className="text-gray-400 font-medium">Rol: <strong className="text-[#E2B86E]">{generatedInvite.teamRole}</strong></span>
                </div>

                <div className="flex items-center space-x-2 text-xs text-amber-300 bg-amber-950/40 p-2 rounded border border-amber-500/30">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Válido por 30 minutos desde ahora.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Enlace Único Generado (Privado)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={getFullInviteUrl(generatedInvite.code)}
                      className="flex-1 bg-[#0D0914] border border-[#522B80] rounded-lg px-3 py-2 text-xs font-mono text-purple-200 focus:outline-none select-all"
                    />
                    <Button
                      onClick={handleCopy}
                      variant={copied ? 'outline' : 'secondary'}
                      size="sm"
                      leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    >
                      {copied ? '¡Copiado!' : 'Copiar'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  Generar otro enlace
                </Button>
                <Button variant="secondary" onClick={onClose}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
