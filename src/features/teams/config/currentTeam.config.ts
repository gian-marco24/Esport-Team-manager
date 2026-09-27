export interface TeamBranding {
  id: string;
  name: string;
  shortName: string;
  tag: string;
  slogan: string;
  description: string;
  logoUrl?: string;
  colors: {
    neonPurple: string;
    royalViolet: string;
    deepViolet: string;
    illuminatedGold: string;
    antiqueGold: string;
    onyxBlack: string;
  };
  game: string;
  establishedYear: number;
}

export const URS_GAMARA_TEAM: TeamBranding = {
  id: 'urs-gamara',
  name: 'URS Gamara',
  shortName: 'Gamara',
  tag: 'UG',
  slogan: 'Crown of Glory & Valor',
  description: 'Equipo profesional de Esports de alto rendimiento especializado en competencias estratégicas y tácticas.',
  colors: {
    neonPurple: '#8B44F7',
    royalViolet: '#522B80',
    deepViolet: '#26143E',
    illuminatedGold: '#E2B86E',
    antiqueGold: '#A88144',
    onyxBlack: '#0D0914',
  },
  game: 'VALORANT / League of Legends',
  establishedYear: 2024,
};

export const CURRENT_TEAM = URS_GAMARA_TEAM;
