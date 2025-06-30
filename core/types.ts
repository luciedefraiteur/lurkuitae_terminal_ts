export interface Étape
{
    type: 'commande' | 'analyse' | 'attente' | 'dialogue' | 'question' | 'réponse';
    contenu: string;
    durée_estimée?: string;
}

export interface PlanRituel
{
    étapes: Étape[];
    complexité: 'simple' | 'modérée' | 'complexe';
    index: number;
}

export interface RituelContext {
  historique: { input: string; plan: PlanRituel }[];
  command_input_history: string[];
  command_output_history: string[];
}