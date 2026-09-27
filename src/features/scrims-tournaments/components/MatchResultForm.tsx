import React from 'react';
import { Link } from 'react-router-dom';
import { Swords, Trophy, Calendar, AlertCircle, ArrowLeft, Plus, MapPin, Video, Trash2, CheckSquare, Square, Save } from 'lucide-react';
import { useCreateMatch } from '../hooks/useCreateMatch';
import { VALORANT_MAP_ROTATION, type ValorantMap } from '../types';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { ScreenshotUploader } from './ScreenshotUploader';
import { LoadingSpinner } from '../../../components/feedback/LoadingSpinner';

export const MatchResultForm: React.FC<{ matchId?: string }> = ({ matchId }) => {
  const {
    isEditing,
    isLoadingMatch,
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
    opponentRoundsLabel,
    handleAddMapToSeries,
    handleRemoveMapFromSeries,
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
    formError,
    isSubmitting,
    handleSubmit,
  } = useCreateMatch(matchId);

  if (isLoadingMatch) {
    return <LoadingSpinner label="Cargando datos del partido..." />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-lg flex items-start space-x-2 text-red-300 text-xs animate-shake">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      {/* 1. TIPO DE PARTIDO */}
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

      {/* 2. EQUIPO RIVAL Y FECHA */}
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

      {/* 3. INGRESO DE MAPAS */}
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

        {/* Lista de mapas ya agregados a la serie en modo Torneo */}
        {matchType === 'tournament' && addedMaps.length > 0 && (
          <div className="space-y-2 border-b border-[#26143E] pb-3">
            <p className="text-[11px] text-gray-400 uppercase font-semibold">Mapas guardados en esta serie:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {addedMaps.map((m, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-[#26143E]/60 border border-[#8B44F7]/30 rounded-lg text-xs"
                >
                  <span className="font-bold text-white">
                    Mapa {idx + 1}: {m.mapName}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-[#E2B86E]">
                      {m.teamScore} - {m.opponentScore}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMapFromSeries(idx)}
                      className="p-1 text-gray-400 hover:text-red-400"
                      title="Quitar mapa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formulario para ingresar mapa actual */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Mapa"
            value={currentMapName}
            onChange={(e) => setCurrentMapName(e.target.value as ValorantMap)}
          >
            {VALORANT_MAP_ROTATION.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>

          <Input
            label="Rondas URS Gamara"
            type="number"
            placeholder="13"
            value={currentTeamScore}
            onChange={(e) => setCurrentTeamScore(e.target.value === '' ? '' : Number(e.target.value))}
          />

          <Input
            label={opponentRoundsLabel}
            type="number"
            placeholder="8"
            value={currentOpponentScore}
            onChange={(e) => setCurrentOpponentScore(e.target.value === '' ? '' : Number(e.target.value))}
          />
        </div>

        {matchType === 'tournament' && (
          <div className="pt-2 flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddMapToSeries}
              leftIcon={<Plus className="w-4 h-4 text-[#E2B86E]" />}
            >
              Guardar Mapa en la Serie
            </Button>
          </div>
        )}
      </div>

      {/* 4. SECCIÓN VOD */}
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

        {/* Si es Scrim: VOD simplificada de 1 solo campo sin mapa ni checkbox */}
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
          /* Si es Torneo: VOD con opción de mapa o todo el partido */
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
                    {VALORANT_MAP_ROTATION.map((m) => (
                      <option key={m} value={m}>
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

      {/* 5. CARGA DE CAPTURAS CON CLOUDINARY (MÚLTIPLES) */}
      <ScreenshotUploader
        screenshotUrls={screenshotUrls}
        isUploading={isUploadingImage}
        maxAllowed={Math.max(1, matchType === 'scrim' ? 1 : addedMaps.length || 1)}
        onFileChange={handleImageFileChange}
        onRemoveScreenshot={handleRemoveScreenshot}
        onAddDirectUrl={handleAddDirectScreenshotUrl}
      />

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
  );
};
