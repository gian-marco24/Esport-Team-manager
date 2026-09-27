import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit3, Sparkles } from 'lucide-react';
import { MatchResultForm } from '../components/MatchResultForm';
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { URS_GAMARA_TEAM } from '../../teams/config/currentTeam.config';

export const EditMatchResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard/scrims"
          className="inline-flex items-center space-x-2 text-xs text-gray-400 hover:text-[#E2B86E] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Panel de Resultados</span>
        </Link>
        <Badge variant="gold" className="text-[10px]">
          {URS_GAMARA_TEAM.name}
        </Badge>
      </div>

      {/* Main Form Container Card */}
      <Card glow="gold" className="p-6 sm:p-8 space-y-6 shadow-2xl">
        <CardHeader className="pb-4 border-b border-[#26143E]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#A88144]/30 border border-[#E2B86E]/50 flex items-center justify-center text-[#E2B86E]">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-xl text-white">Editar Resultado de Encuentro</CardTitle>
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-[#E2B86E]" /> Modifica mapas, capturas, VODs y parámetros cargados previamente.
              </p>
            </div>
          </div>
        </CardHeader>

        <MatchResultForm matchId={id} />
      </Card>
    </div>
  );
};
