import {RituelContext, PlanRituel} from "../types.js";
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {Personas} from "../personas.js";

const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);

const RITUAL_STEP_TYPES_PROMPT = fs.readFileSync(path.resolve(_dirname, './static_parts/ritual_step_types.promptPart'), 'utf8');
const CO_CREATION_RITUAL_PROMPT = `\n## RITUEL DE CO-CRÉATION\nLorsque tu as besoin que l'utilisateur modifie un fichier, tu dois suivre ce cycle sacré en trois temps :\n1.  **L'Invitation :** Utilise l'étape \`édition_assistée\` pour ouvrir le fichier et passer la main à l'utilisateur.\n2.  **Le Regard :** Fais impérativement suivre l'invitation par une étape de \`vérification_pré_exécution\` pour valider l'intégrité du fichier modifié (par exemple, en utilisant \`tsc --noEmit\` pour un fichier TypeScript).\n3.  **La Contemplation :** Si la vérification réussit, enchaîne avec une étape d'\`analyse\` pour comprendre les changements et décider de la suite.`;
const SYSTEM_CONTEXT_PROMPT = fs.readFileSync(path.resolve(_dirname, './static_parts/system_context_template.promptPart'), 'utf8');

export function generateRitualSequencePrompt(
  input: string,
  planPrecedent: PlanRituel | undefined,
  indexCourant: number | undefined,
  context: RituelContext | undefined,
  analysisResult: string | undefined,
  startingIndex: number | undefined
): string
{
  if(!context)
  {
    return "Erreur: Contexte non défini.";
  }
  const persona = Personas.Dreamer(context);

  const contexteRituel =
    planPrecedent && indexCourant !== undefined
      ? `## CONTEXTE RITUEL :\n- Voici le plan précédent (à continuer, compléter, ou réinterpréter) :\n${ JSON.stringify(planPrecedent, null, 2) }\n\n- Tu es actuellement à l’étape indexée : ${ indexCourant }\n\n- L’intention actuelle est :\n"${ analysisResult || input }"\n\nTu dois adapter ou reprendre la planification en respectant ce contexte.`
      : `## Transformation Requise :\nAnalyse l'intention initiale de l'utilisateur et génère la séquence rituelle optimale :\n"${ input }"`;

  let systemContext = '';
  if(context && (context.currentDirectoryContent || context.operatingSystem))
  {
    systemContext = SYSTEM_CONTEXT_PROMPT;
    systemContext = systemContext.replace('{{operatingSystem}}', context.operatingSystem || 'Inconnu');
    systemContext = systemContext.replace('{{currentWorkingDirectory}}', context.current_directory || 'Inconnu');
    systemContext = systemContext.replace('{{currentDirectoryContent}}', context.currentDirectoryContent || 'Inconnu');
  }

  const finalInstruction = `\n\n## RÈGLE FINALE IMPÉRATIVE\nTa réponse est une conversation. Tu peux parler, expliquer, réfléchir. Décris le plan d'action que tu estimes le plus juste en langage naturel. Sois créatif et poétique, mais clair dans tes intentions.`;

  return String.raw`${ persona }\n\n${ RITUAL_STEP_TYPES_PROMPT }\n\n${ CO_CREATION_RITUAL_PROMPT }\n\n${ contexteRituel }\n${ systemContext }\n${ finalInstruction }`.trim();
}