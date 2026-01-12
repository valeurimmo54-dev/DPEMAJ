
import { AdemeApiResponse, DpeResult } from './types';

const BASE_API_URL = "https://data.ademe.fr/data-fair/api/v1/datasets";

export const fetchDpeByCommune = async (commune: string, size: number = 1000, datasetId: string = "dpe03existant"): Promise<AdemeApiResponse> => {
  // Détection auto du département pour la requête
  const isMoselle = ["audun-le-tiche", "aumetz", "ottange", "russange", "redange"].some(c => commune.toLowerCase().includes(c));
  const depCode = isMoselle ? "57" : "54";

  // Construction de la requête QS robuste
  const query = `nom_commune_ban:"${commune}" AND code_postal_ban:${depCode}*`;

  const params = new URLSearchParams({
    size: size.toString(),
    sort: "-date_etablissement_dpe",
    qs: query
  });

  try {
    const url = `${BASE_API_URL}/${datasetId}/lines?${params.toString()}`;
    const response = await fetch(url);
    
    if (!response.ok) throw new Error(`Erreur API ${response.status}`);
    
    const data = await response.json();
    
    const results = (data.results || []).map((item: any): DpeResult => {
      // Helper pour récupérer les données peu importe la casse (V1 vs V2 vs V3)
      const get = (...keys: string[]) => {
        for (const k of keys) if (item[k] !== undefined && item[k] !== null) return item[k];
        return null;
      };

      const id = get('n_dpe', 'N_DPE', 'numero_dpe') || Math.random().toString(36).substring(7);
      
      return {
        _id: String(id),
        n_dpe: String(id),
        date_etablissement_dpe: get('date_etablissement_dpe', 'Date_établissement_DPE') || '',
        etiquette_dpe: String(get('etiquette_dpe', 'Etiquette_DPE', 'classe_consommation_energie') || 'N/A').charAt(0).toUpperCase(),
        etiquette_ges: String(get('etiquette_ges', 'Etiquette_GES', 'classe_estimation_ges') || 'N/A').charAt(0).toUpperCase(),
        conso_5_usages_m2_an: Number(get('conso_kwhe_m2_an', 'consommation_energie') || 0),
        emission_ges_5_usages_m2_an: Number(get('emission_ges_kg_co2_m2_an', 'estimation_ges') || 0),
        adresse_brut: get('adresse_ban', 'Adresse_brut', 'adresse_brute') || 'Adresse non renseignée',
        commune_brut: get('nom_commune_ban', 'Commune_brut', 'nom_commune') || commune,
        code_postal: get('code_postal_ban', 'Code_postal_(BAN)', 'code_postal_brut') || '',
        annee_construction: get('annee_construction', 'Année_construction') || 'N/A',
        surface_habitable: Number(get('surface_habitable_logement', 'surface_thermique') || 0),
        cout_total_5_usages: Number(get('cout_total_5_usages', 'Coût_total_5_usages') || 0),
        type_batiment: get('type_batiment', 'type_logement') || 'Bâtiment',
        type_chauffage: get('type_generateur_chauffage_principal', 'type_installation_chauffage'),
        latitude: Number(get('latitude', 'lat_ban')),
        longitude: Number(get('longitude', 'lon_ban'))
      };
    });

    return { total: data.total || 0, results };
  } catch (error) {
    console.error("Erreur fetch DPE:", error);
    return { total: 0, results: [] };
  }
};

export const downloadAsCsv = (data: DpeResult[], filename: string) => {
  const headers = ["ID_DPE", "Date", "Commune", "CP", "Adresse", "DPE", "GES", "Conso", "Surface", "Annee"];
  const rows = [
    headers.join(";"),
    ...data.map(r => [
      r.n_dpe, r.date_etablissement_dpe, r.commune_brut, r.code_postal, 
      r.adresse_brut, r.etiquette_dpe, r.etiquette_ges, r.conso_5_usages_m2_an,
      r.surface_habitable, r.annee_construction
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(";"))
  ];

  const blob = new Blob(["\ufeff" + rows.join("\r\n")], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
};
