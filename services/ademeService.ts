
import { AdemeApiResponse, DpeResult } from '../types';

const BASE_API_URL = "https://data.ademe.fr/data-fair/api/v1/datasets";

export const fetchDpeByCommune = async (commune: string, size: number = 2000, datasetId: string = "dpe03existant"): Promise<AdemeApiResponse> => {
  
  // Tri par date la plus récente systématiquement
  const sortField = "-date_etablissement_dpe";
  let queryFilter = ""; 

  const isAudun = commune.toLowerCase().includes("audun");
  const deptFilter = isAudun ? "57*" : "54*";

  if (datasetId.includes("dpe03existant") || datasetId.includes("neufs")) {
    queryFilter = `nom_commune_ban:"${commune}" AND code_postal_ban:${deptFilter}`;
  } else {
    queryFilter = `nom_commune:"${commune}" AND code_postal_brut:${deptFilter}`;
  }

  const params = new URLSearchParams({
    size: size.toString(),
    sort: sortField,
    qs: queryFilter
  });

  try {
    const response = await fetch(`${BASE_API_URL}/${datasetId}/lines?${params.toString()}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur API ADEME (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    
    const results = (data.results || []).map((item: any): DpeResult => {
      const id = item.n_dpe || item.identifiant_dpe || item.numero_dpe || Math.random().toString(36);
      const etiquette = item.etiquette_dpe || item.classe_consommation_energie || item.classe_bilan_dpe || 'N/A';
      const ges = item.etiquette_ges || item.classe_estimation_ges || 'N/A';
      
      const surface = Number(item.surface_habitable_logement || item.surface_habitable || item.surface_thermique || 0);
      const consoVal = Number(item.conso_kwhe_m2_an || item.consommation_energie || item.consommation_energie_primaire_indicedpe || 0);
      const gesVal = Number(item.emission_ges_kg_co2_m2_an || item.estimation_ges || item.estimation_ges_indicedpe || 0);

      const adresse = item.adresse_ban || item.adresse_brute || item.adresse_bien || '';
      const cp = item.code_postal_ban || item.code_postal_brut || item.code_postal_bien || '';

      // Fix: Add missing type_batiment field required by DpeResult interface
      return {
        _id: String(id),
        n_dpe: String(id),
        date_etablissement_dpe: item.date_etablissement_dpe || '',
        etiquette_dpe: String(etiquette).toUpperCase(),
        etiquette_ges: String(ges).toUpperCase(),
        conso_5_usages_m2_an: consoVal,
        emission_ges_5_usages_m2_an: gesVal,
        adresse_brut: adresse,
        commune_brut: item.nom_commune_ban || item.nom_commune || commune,
        code_postal: cp,
        annee_construction: item.annee_construction || 'N/A',
        surface_habitable: surface,
        cout_total_5_usages: Number(item.cout_total_5_usages || 0),
        type_batiment: item.type_batiment || item.type_logement || 'Non spécifié'
      };
    });

    return {
      total: data.total || 0,
      results
    };
  } catch (error: any) {
    console.error(`Erreur fetch pour ${commune}:`, error);
    throw error;
  }
};

export const fetchAllCommunes = async (
  communes: string[], 
  datasetId: string, 
  onProgress?: (count: number, total: number) => void
): Promise<DpeResult[]> => {
  const allResults: DpeResult[] = [];
  const total = communes.length;

  for (let i = 0; i < total; i++) {
    try {
      // Attente pour ne pas saturer l'API
      await new Promise(r => setTimeout(r, 150)); 
      const res = await fetchDpeByCommune(communes[i], 1000, datasetId);
      allResults.push(...res.results);
    } catch (e) {
      console.warn(`Erreur sur ${communes[i]}`);
    }
    if (onProgress) onProgress(i + 1, total);
  }
  return allResults;
};

export const downloadAsCsv = (data: DpeResult[], filename: string) => {
  if (data.length === 0) {
    alert("Aucune donnée à exporter.");
    return;
  }
  
  const headers = ["ID_DPE", "Date_Etablissement", "Commune", "Code_Postal", "Adresse", "Etiquette_DPE", "Etiquette_GES", "Consommation_kWh_m2", "GES_kg_m2", "Surface_m2", "Annee_Construction", "Estimation_Cout_EUR"];
  
  const csvRows = [
    headers.join(";"), // Séparateur point-virgule pour Excel FR
    ...data.map(r => [
      r.n_dpe, 
      r.date_etablissement_dpe, 
      r.commune_brut, 
      r.code_postal, 
      r.adresse_brut, 
      r.etiquette_dpe, 
      r.etiquette_ges, 
      r.conso_5_usages_m2_an, 
      r.emission_ges_5_usages_m2_an,
      r.surface_habitable, 
      r.annee_construction, 
      r.cout_total_5_usages
    ].map(v => `"${String(v ?? '').replace(/"/g, '""').replace(/[\n\r]+/g, ' ')}"`).join(";"))
  ];

  const csvContent = csvRows.join("\r\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Utilisation d'une méthode de téléchargement forcée
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  
  document.body.appendChild(link);
  link.click();
  
  // Nettoyage immédiat
  setTimeout(() => {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 100);
};
