import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Swords,
  Trophy,
  Calendar,
  AlertCircle,
  ArrowLeft,
  Plus,
  MapPin,
  Video,
  Trash2,
  CheckSquare,
  Square,
  Save,
  Gamepad2,
  Sparkles,
} from 'lucide-react';
import { useCreateMatch } from '../hooks/useCreateMatch';
import { VALORANT_MAP_ROTATION } from '../types';
import { valorantApiService } from '../../../services/valorantApiService';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { ScreenshotUploader } from './ScreenshotUploader';
import { ScoreboardScannerModal } from './ScoreboardScannerModal';
import { LoadingSpinner } from '../../../components/feedback/LoadingSpinner';

export const MatchResultForm: React.FC<{ matchId?: string }> = ({ matchId }) => {
  const {
    isEditing,
    isLoadingMatch,
    rosters,
    selectedRosterId,
    setSelectedRosterId,
    selectedRoster,
    rosterMembers,
    isValorantRoster,
    matchType,
    setMatchType,
    tournamentName,
    setTournamentName,
    opponentName,
    setOpponentName,
    date,
    setDate,
    addedMaps,
    currentMapName,
    setCurrentMapName,
    currentTeamScore,
    setCurrentTeamScore,
    currentOpponentScore,
    setCurrentOpponentScore,
    currentPlayerStats,
    opponentRoundsLabel,
    handleAddMapToSeries,
    handleRemoveMapFromSeries,
    handleEditMapInSeries,
    handleClearCurrentMapDraft,
    addedVods,
    newVodUrl,
    setNewVodUrl,
    newVodIsFullMatch,
    setNewVodIsFullMatch,
    newVodMapName,
    setNewVodMapName,
    handleAddVod,
    handleRemoveVod,
    screenshotUrls,
    isUploadingImage,
    handleImageFileChange,
    handleRemoveScreenshot,
    handleAddDirectScreenshotUrl,
    isOcrModalOpen,
    setIsOcrModalOpen,
    ocrTargetImage,
    ocrTargetFile,
    handleScanSpecificScreenshot,
    handleApplyOcrResults,
    formError,
    isSubmitting,
    handleSubmit,
  } = useCreateMatch(matchId);

  const [availableMaps, setAvailableMaps] = useState<string[]>([...VALORANT_MAP_ROTATION]);

  useEffect(() => {
    const fetchMaps = async () => {
      const mapsData = await valorantApiService.getMaps();
      if (mapsData && mapsData.length > 0) {
        setAvailableMaps(mapsData.map((m) => m.displayName));
      }
    };
    fetchMaps();
  }, []);

  if (isLoadingMatch) {
    return <LoadingSpinner label="Cargando datos del partido..." />;
  }

  const isCurrentMapInSeries = addedMaps.some(
    (m) => m.mapName.trim().toLowerCase() === currentMapName.trim().toLowerCase()
  );

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {formError && (
          <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-lg flex items-start space-x-2 text-red-300 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {/* 1. SELECCIÓN DE ROSTER */}
        <div className="p-4 bg-[#140b21] border border-[#26143E] rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#E2B86E] flex items-center gap-1.5">
              <Gamepad2 className="w-4 h-4 text-[#8B44F7]" />
              <span>Roster Asignado al Resultado</span>
            </label>
            {selectedRoster && (
              <Badge variant={isValorantRoster ? 'gold' : 'purple'} className="text-[10px] font-bold">
                Juego: {selectedRoster.game}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Seleccionar Roster"
              value={selectedRosterId}
              onChange={(e) => setSelectedRosterId(e.target.value)}
            >
              {rosters.length === 0 ? (
                <option value="">Cargando rosters...</option>
              ) : (
                rosters.map((r) => (
                  <option key={r.id} value={r.id} className="bg-[#140b21] text-white">
                    {r.name} ({r.game})
                  </option>
                ))
              )}
            </Select>

            <div className="flex items-center space-x-3 p-3 bg-[#180d29]/80 border border-[#522B80]/30 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-[#522B80]/50 flex items-center justify-center text-[#E2B86E] shrink-0 font-bold text-xs">
                {selectedRoster?.logoUrl ? (
                  <img src={selectedRoster.logoUrl} alt="" className="w-full h-full object-contain" />
                ) : (
                  <Gamepad2 className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0 text-xs">
                <p className="font-bold text-white truncate">{selectedRoster?.name || 'Roster del Equipo'}</p>
                <p className="text-[11px] text-gray-400">
                  {rosterMembers.length} {rosterMembers.length === 1 ? 'jugador vinculado' : 'jugadores vinculados'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. TIPO DE PARTIDO */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
            Tipo de Encuentro
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMatchType('scrim')}
              className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border font-bold text-xs transition-all ${
                matchType === 'scrim'
                  ? 'bg-[#522B80] border-[#8B44F7] text-white shadow-lg shadow-[#8B44F7]/30 ring-1 ring-[#8B44F7]'
                  : 'bg-[#180d29] border-[#26143E] text-gray-400 hover:text-gray-200'
              }`}
            >
              <Swords className={`w-4 h-4 ${matchType === 'scrim' ? 'text-[#8B44F7]' : ''}`} />
              <span>Scrim (1 Mapa)</span>
            </button>

            <button
              type="button"
              onClick={() => setMatchType('tournament')}
              className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border font-bold text-xs transition-all ${
                matchType === 'tournament'
                  ? 'bg-[#A88144]/40 border-[#E2B86E] text-white shadow-lg shadow-[#E2B86E]/30 ring-1 ring-[#E2B86E]'
                  : 'bg-[#180d29] border-[#26143E] text-gray-400 hover:text-gray-200'
              }`}
            >
              <Trophy className={`w-4 h-4 ${matchType === 'tournament' ? 'text-[#E2B86E]' : ''}`} />
              <span>Torneo Oficial (Serie / Multi-mapa)</span>
            </button>
          </div>
        </div>

        {/* CAMPO TORNEO */}
        {matchType === 'tournament' && (
          <div className="animate-fadeIn">
            <Input
              label="Nombre del Torneo / Competencia"
              type="text"
              placeholder="ej. VALORANT Challengers Latam - Qualifier #1"
              leftIcon={<Trophy className="w-4 h-4 text-[#E2B86E]" />}
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
            />
          </div>
        )}

        {/* 3. EQUIPO RIVAL Y FECHA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Equipo Rival"
            type="text"
            placeholder="ej. KRÜ Esports"
            leftIcon={<Swords className="w-4 h-4" />}
            value={opponentName}
            onChange={(e) => setOpponentName(e.target.value)}
          />

          <Input
            label="Fecha del Partido"
            type="date"
            leftIcon={<Calendar className="w-4 h-4" />}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* 4. INGRESO DE MAPAS */}
        <div className="space-y-4 p-4 bg-[#140b21] border border-[#26143E] rounded-xl">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#E2B86E] flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#8B44F7]" />
              <span>{matchType === 'tournament' ? 'Agregar Mapas a la Serie' : 'Datos del Mapa'}</span>
            </h4>
            {matchType === 'tournament' && (
              <span className="text-[11px] text-gray-400 font-semibold">
                Mapas Agregados: {addedMaps.length}
              </span>
            )}
          </div>

          {/* Lista de mapas ya agregados / guardados */}
          {addedMaps.length > 0 && (
            <div className="space-y-2 border-b border-[#26143E] pb-3">
              <p className="text-[11px] text-gray-400 uppercase font-semibold">
                {matchType === 'tournament' ? 'Mapas guardados en esta serie:' : 'Rondas guardadas para la Scrim:'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {addedMaps.map((m, idx) => {
                  const hasStats = m.playerStats && m.playerStats.length > 0;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-[#26143E]/60 border border-[#8B44F7]/30 rounded-lg text-xs hover:border-[#8B44F7] transition-colors"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          <span className="font-bold text-white">
                            {matchType === 'tournament' ? `Mapa ${idx + 1}: ${m.mapName}` : `Mapa: ${m.mapName}`}
                          </span>
                          {hasStats && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 rounded-full font-semibold flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" />
                              {m.playerStats!.length} stats
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-extrabold text-[#E2B86E]">
                          {m.teamScore} - {m.opponentScore} rondas
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditMapInSeries(idx)}
                          className="px-2 py-1 bg-[#522B80]/60 hover:bg-[#8B44F7] text-[10px] text-white rounded font-semibold transition-colors"
                          title="Cargar mapa en el formulario para editar"
                        >
                          Cargar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveMapFromSeries(idx)}
                          className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                          title="Quitar mapa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Formulario para ingresar mapa actual */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Mapa"
              value={currentMapName}
              onChange={(e) => setCurrentMapName(e.target.value)}
            >
              {availableMaps.map((m) => (
                <option key={m} value={m} className="bg-[#140b21] text-white">
                  {m}
                </option>
              ))}
            </Select>

            <Input
              label="Rondas URS Gamara"
              type="number"
              placeholder="ej. 13"
              value={currentTeamScore}
              onChange={(e) => setCurrentTeamScore(e.target.value === '' ? '' : Number(e.target.value))}
            />

            <Input
              label={opponentRoundsLabel}
              type="number"
              placeholder="ej. 11"
              value={currentOpponentScore}
              onChange={(e) => setCurrentOpponentScore(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>

          {/* Individual Player Stats Summary Preview (if OCR processed) */}
          {currentPlayerStats.length > 0 && (
            <div className="p-3 bg-[#180d29] border border-[#8B44F7]/30 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[#E2B86E]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Estadísticas de Jugadores Extraídas ({currentPlayerStats.length})</span>
                </span>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={handleClearCurrentMapDraft}
                    className="text-[11px] text-gray-400 hover:text-red-400 font-medium"
                    title="Descartar estadísticas del borrador"
                  >
                    Descartar stats
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOcrModalOpen(true)}
                    className="text-[11px] text-[#8B44F7] hover:text-[#E2B86E] font-semibold underline"
                  >
                    Editar tabla de stats
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                {currentPlayerStats.map((p, idx) => {
                  const kda = p.kdaRatio ?? (p.deaths > 0 ? Number(((p.kills + p.assists) / p.deaths).toFixed(2)) : p.kills + p.assists);
                  return (
                    <div key={idx} className="p-2 bg-[#140b21] border border-[#522B80]/40 rounded-lg text-center space-y-1">
                      <div className="flex items-center justify-center space-x-1.5 min-w-0">
                        {p.agentIcon ? (
                          <img
                            src={p.agentIcon}
                            alt={p.agent || 'Agente'}
                            className="w-4 h-4 rounded-full bg-[#26143E] object-contain shrink-0 border border-[#8B44F7]/40"
                            title={p.agent}
                          />
                        ) : null}
                        <p className="font-bold text-white text-[11px] truncate">
                          {p.playerNick}
                        </p>
                        {p.isGuest && (
                          <span className="text-[8px] bg-amber-950 text-amber-300 px-1 rounded shrink-0">Inv.</span>
                        )}
                      </div>
                      {p.agent && (
                        <p className="text-[10px] text-purple-300 font-semibold truncate">{p.agent}</p>
                      )}
                      <p className="text-[10px] text-[#E2B86E] font-extrabold">{p.kills}/{p.deaths}/{p.assists}</p>
                      <p className="text-[9px] text-gray-400 font-medium">KDA: {kda.toFixed(2)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
            <div>
              {currentPlayerStats.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearCurrentMapDraft}
                  className="text-xs text-gray-400 hover:text-red-400 font-medium transition-colors"
                >
                  Limpiar datos del mapa
                </button>
              )}
            </div>

            {matchType === 'tournament' ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddMapToSeries}
                leftIcon={<Plus className="w-4 h-4 text-[#E2B86E]" />}
              >
                {isCurrentMapInSeries ? `Actualizar ${currentMapName} en la Serie` : `Guardar Mapa en la Serie`}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddMapToSeries}
                leftIcon={<Save className="w-4 h-4 text-[#E2B86E]" />}
              >
                {addedMaps.length > 0 ? `Actualizar Rondas del Mapa` : `Guardar Rondas del Mapa`}
              </Button>
            )}
          </div>
        </div>

        {/* 5. CARGA DE CAPTURAS CON OCR (MÚLTIPLES) - AHORA ARRIBA DE VODS */}
        <ScreenshotUploader
          screenshotUrls={screenshotUrls}
          isUploading={isUploadingImage}
          maxAllowed={Math.max(1, matchType === 'scrim' ? 1 : addedMaps.length || 1)}
          isValorant={isValorantRoster}
          onFileChange={handleImageFileChange}
          onRemoveScreenshot={handleRemoveScreenshot}
          onAddDirectUrl={handleAddDirectScreenshotUrl}
          onScanScreenshot={handleScanSpecificScreenshot}
        />

        {/* 6. SECCIÓN VOD */}
        <div className="space-y-3 p-4 bg-[#140b21] border border-[#26143E] rounded-xl">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#E2B86E] flex items-center gap-1.5">
            <Video className="w-4 h-4 text-[#8B44F7]" />
            <span>Enlaces de VOD (Opcional)</span>
          </h4>

          {/* Lista de VODs agregadas */}
          {addedVods.length > 0 && (
            <div className="space-y-2 pb-2">
              {addedVods.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-2 bg-[#26143E]/50 border border-[#522B80]/40 rounded-lg text-xs"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="px-2 py-0.5 bg-[#522B80] text-white text-[10px] font-bold rounded shrink-0">
                      {v.isFullMatch ? 'Partido Completo' : v.mapName || 'Mapa'}
                    </span>
                    <a
                      href={v.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#E2B86E] hover:underline truncate"
                    >
                      {v.url}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveVod(v.id)}
                    className="p-1 text-gray-400 hover:text-red-400 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Si es Scrim: VOD simplificada */}
          {matchType === 'scrim' ? (
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  label="Enlace de VOD (YouTube, Twitch, Drive)"
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={newVodUrl}
                  onChange={(e) => setNewVodUrl(e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 shrink-0"
                onClick={handleAddVod}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Agregar VOD
              </Button>
            </div>
          ) : (
            /* Si es Torneo: VOD con opción de mapa */
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-7">
                  <Input
                    label="Enlace de VOD (YouTube, Twitch, Drive)"
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={newVodUrl}
                    onChange={(e) => setNewVodUrl(e.target.value)}
                  />
                </div>

                {!newVodIsFullMatch && (
                  <div className="sm:col-span-3">
                    <Select
                      label="Mapa VOD"
                      value={newVodMapName}
                      onChange={(e) => setNewVodMapName(e.target.value)}
                    >
                      {availableMaps.map((m) => (
                        <option key={m} value={m} className="bg-[#140b21] text-white">
                          {m}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}

                <div className={newVodIsFullMatch ? 'sm:col-span-5' : 'sm:col-span-2'}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full h-10"
                    onClick={handleAddVod}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Agregar VOD
                  </Button>
                </div>
              </div>

              <div className="pt-1">
                <label
                  onClick={() => setNewVodIsFullMatch(!newVodIsFullMatch)}
                  className="inline-flex items-center space-x-2 text-xs text-gray-300 cursor-pointer select-none"
                >
                  {newVodIsFullMatch ? (
                    <CheckSquare className="w-4 h-4 text-[#8B44F7]" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-500" />
                  )}
                  <span>Esta VOD corresponde a todo el partido (todos los mapas juntos)</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* BOTONES DE ACCIÓN FINAL */}
        <div className="flex items-center justify-between pt-4 border-t border-[#26143E]">
          <Link to="/dashboard/scrims">
            <Button type="button" variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Cancelar
            </Button>
          </Link>

          <Button
            type="submit"
            variant="secondary"
            isLoading={isSubmitting || isUploadingImage}
            leftIcon={isEditing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          >
            {isEditing ? 'Guardar Cambios' : 'Guardar Partido en Base de Datos'}
          </Button>
        </div>
      </form>

      {/* OCR SCANNER MODAL */}
      <ScoreboardScannerModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        imageUrl={ocrTargetImage}
        imageFile={ocrTargetFile}
        rosterMembers={rosterMembers}
        currentMapName={currentMapName}
        currentTeamScore={currentTeamScore}
        currentOpponentScore={currentOpponentScore}
        existingMaps={addedMaps}
        onApplyResults={handleApplyOcrResults}
      />
    </>
  );
};
