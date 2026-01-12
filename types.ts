
export interface DpeResult {
  _id: string;
  n_dpe: string;
  date_etablissement_dpe: string;
  etiquette_dpe: string;
  etiquette_ges: string;
  conso_5_usages_m2_an: number;
  emission_ges_5_usages_m2_an: number;
  adresse_brut: string;
  commune_brut: string;
  code_postal: string;
  annee_construction: string | number;
  surface_habitable: number;
  cout_total_5_usages: number;
  type_batiment: string;
  type_chauffage?: string;
  latitude?: number;
  longitude?: number;
}

export interface AdemeApiResponse {
  total: number;
  results: DpeResult[];
}

export enum FetchStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
