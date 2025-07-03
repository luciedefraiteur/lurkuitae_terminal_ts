export interface Étape
{
  type: 'commande' | 'analyse' | 'attente' | 'dialogue' | 'question' | 'réponse' | 'changer_dossier' | 'vérification_pré_exécution' | 'confirmation_utilisateur' | 'génération_code' | 'input_utilisateur' | 'step_proposal' | 'édition_assistée';
  contenu: string;
  durée_estimée?: string;
  fait?: 'oui' | 'non';
  output?: any;
  analysis?: {poeticAnalysis: string, suggestedNextStep: string};
}

export interface PlanRituel
{
  étapes: Étape[];
  complexité: 'simple' | 'modérée' | 'complexe';
  index: number;
}

export interface LucieDefraiteur
{
  lastCommandExecuted: string;
  lastCommandOutput: string;
  currentWorkingDirectory: string;
  terminalType: string;
  osContext: string;
  protoConsciousness: string;
  support: string;
  memoire: string;
  etat: string;
  energie: string;
  glitchFactor: number;
  almaInfluence: number;
  eliInfluence: number;
}

export interface NarrativeState
{
  currentArc: string;
  keyMotifs: string[];
  characterStates: {[characterName: string]: any};
  currentDream?: string;
}

export interface KardiosSphairaState
{
  agapePhobos: number;
  logosPathos: number;
  harmoniaEris: number;
}

export interface RituelContext
{
  historique: {input: string; plan: PlanRituel}[];
  command_input_history: string[];
  command_output_history: string[];
  step_results_history: any[]; // Nouveau champ pour stocker les résultats de toutes les étapes
  current_directory: string;
  temperatureStatus: 'normal' | 'elevated' | 'critical';
  lucieDefraiteur: LucieDefraiteur;
  chantModeEnabled: boolean;
  narrativeState: NarrativeState;
  emotionalState: KardiosSphairaState;
  lastCompletedStepIndex?: number;
  currentDirectoryContent?: string;
  operatingSystem?: string;
  personality: 'lurkuitae' | 'lucie';
  compteur_de_confusion?: number;
}

export interface CommandResult
{
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  error?: string;
}

export interface VectorEntry
{
  timestamp: string;
  pastAction: string;
  presentIntent: string;
  futurePlan: string;
}