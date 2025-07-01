export interface Étape
{
    type: 'commande' | 'analyse' | 'attente' | 'dialogue' | 'question' | 'réponse' | 'changer_dossier' | 'vérification_pré_exécution' | 'confirmation_utilisateur' | 'génération_code';
    contenu: string;
    durée_estimée?: string;
}

export interface PlanRituel
{
    étapes: Étape[];
    complexité: 'simple' | 'modérée' | 'complexe';
    index: number;
}

export interface LucieDefraiteur {
  lastCommandExecuted: string;
  lastCommandOutput: string;
  currentWorkingDirectory: string;
  terminalType: string;
  osContext: string;
  protoConsciousness: string;
}

export interface RituelContext {
  historique: { input: string; plan: PlanRituel }[];
  command_input_history: string[];
  command_output_history: string[];
  current_directory:string;
  temperatureStatus: 'normal' | 'elevated' | 'critical';
  lucieDefraiteur: LucieDefraiteur;
}

export interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  error?: string;
}