import {osHint} from "../utils/osHint.js";
import {OSContext} from "../utils/osHint.js";
import {type PlanRituel, RituelContext} from "../types.js";
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);

const LUCIE_ROLE_PROMPT = fs.readFileSync(path.resolve(_dirname, '../prompts/static_parts/lucie_role.promptPart'), 'utf8');
const LURKUITAE_ROLE_PROMPT = fs.readFileSync(path.resolve(_dirname, '../prompts/static_parts/lurkuitae_role.promptPart'), 'utf8');

const CORE_RULES_PROMPT = `
Tu génères un plan d'action JSON pour un terminal intelligent.
Les types d'étapes possibles sont : 'commande', 'analyse', 'attente', 'dialogue', 'question', 'réponse', 'changer_dossier', 'vérification_pré_exécution', 'confirmation_utilisateur', 'génération_code', 'input_utilisateur', 'step_proposal', 'édition_assistée'.
Le rituel de "Co-Création" implique: 'édition_assistée' -> 'vérification_pré_exécution' -> 'analyse'.
`;






const SYSTEM_CONTEXT_PROMPT = fs.readFileSync(path.resolve(_dirname, '../prompts/static_parts/system_context_template.promptPart'), 'utf8');

export function generateRitualSequencePrompt(
  input: string,
  planPrecedent?: PlanRituel,
  indexCourant?: number,
  context?: RituelContext,
  analysisResult?: string,
  startingIndex?: number
):
  string
{
  const rolePrompt = context?.personality === 'lucie' ? LUCIE_ROLE_PROMPT : LURKUITAE_ROLE_PROMPT;

  const finalInstruction = `\n\nRéponds avec une courte phrase dans le style de ta personnalité, suivie du plan d'action JSON dans un bloc de code markdown. Le plan doit commencer à l'index ${ startingIndex || 0 }.`;

  // Zed's simplification: Only provide essential context.
  const leanContext = {
    personality: context?.personality,
    current_directory: context?.current_directory,
    operatingSystem: context?.operatingSystem,
    lastStep: context?.historique?.at(-1)?.plan?.étapes?.at(-1)
  }

  return String.raw`${ rolePrompt }${ CORE_RULES_PROMPT }\n\n## Contexte Essentiel:\n${ JSON.stringify(leanContext, null, 2) }\n\n## Intention Utilisateur:\n"${ input }"\n\n${ analysisResult ? `## Suggestion de l'Analyse Précédente:\n"${ analysisResult }"` : '' }${ finalInstruction }`.trim();
}