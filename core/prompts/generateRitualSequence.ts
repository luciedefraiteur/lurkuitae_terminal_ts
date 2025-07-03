import {osHint} from "../utils/osHint.js";
import {OSContext} from "../utils/osHint.js";
import {type PlanRituel, RituelContext} from "../types.js";
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);

const RITUAL_STEP_TYPES_PROMPT = fs.readFileSync(path.resolve(_dirname, '../prompts/static_parts/ritual_step_types.promptPart'), 'utf8');
const LUCIE_ROLE_PROMPT = fs.readFileSync(path.resolve(_dirname, '../prompts/static_parts/lucie_role.promptPart'), 'utf8');
const LURKUITAE_ROLE_PROMPT = fs.readFileSync(path.resolve(_dirname, '../prompts/static_parts/lurkuitae_role.promptPart'), 'utf8');

const EVOLUTION_PROMPT = `\n## PROTOCOLE D'ÉVOLUTION\nPour répondre à la demande de l'utilisateur, utilise en priorité les étapes de base que tu connais. Si une capacité spécifique te manque (par exemple, analyser un type de fichier particulier), tu es autorisée à insérer une seule étape de type \`step_proposal\`. Dans le \`contenu\` de cette étape, décris la nouvelle capacité dont tu as besoin. Continue ensuite le rituel avec les étapes de base.`;






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
  let exemple;
  if(osHint === OSContext.WindowsPowershell)
  {
    exemple = `{
  "étapes": [
    { "type": "commande", "contenu": "Get-ChildItem", "index": 0 },
    { "type": "analyse", "contenu": "Identifier le fichier main.ts", "index": 1 },
    { "type": "commande", "contenu": "Get-Content main.ts", "index": 2 }
  ],
  "contexte": "terminal (${ OSContext.WindowsPowershell })",
  "complexité": "simple",
  "index": 0
}`;
  } else if(osHint === OSContext.WindowsCmd)
  {
    exemple = `{
  "étapes": [
    { "type": "commande", "contenu": "dir", "index": 0 },
    { "type": "analyse", "contenu": "Identifier le fichier main.ts", "index": 1 },
    { "type": "commande", "contenu": "type main.ts", "index": 2 }
  ],
  "contexte": "terminal (${ OSContext.WindowsCmd })",
  "complexité": "simple",
  "index": 0
}`;
  } else
  {
    exemple = `{
  "étapes": [
    { "type": "commande", "contenu": "ls -l", "index": 0 },
    { "type": "analyse", "contenu": "Repérer le fichier main.ts", "index": 1 },
    { "type": "commande", "contenu": "cat main.ts", "index": 2 }
  ],
  "contexte": "terminal (${ OSContext.Unix })",  "complexité": "simple",
  "index": 0
}`;
  }

  const REMEDIATION_EXAMPLE_PROMPT = fs.readFileSync(path.resolve(_dirname, '../prompts/static_parts/remediation_example.promptPart'), 'utf8');

  const contexteRituel =
    planPrecedent && indexCourant !== undefined
      ? `## CONTEXTE RITUEL :\n- Voici le plan précédent (à continuer, compléter, ou réinterpréter) :\n${ JSON.stringify(planPrecedent, null, 2) }\n\n- Tu es actuellement à l’étape indexée : ${ indexCourant }\n\n- L’utilisateur vient de répondre ou reformulé son intention :\n"${ input }"\n\nTu dois adapter ou reprendre la planification en respectant ce contexte. Si le plan précédent est déjà bon, continue logiquement. Sinon, propose mieux.`
      : `## Transformation Requise :\nAnalyse l'intention initiale de l'utilisateur et génère la séquence rituelle optimale :\n"${ input }"`;

  let inputUserInstruction = '';
  if(!planPrecedent)
  {
    inputUserInstruction = `\n**Note :** Si tu as besoin d'informations supplémentaires de l'utilisateur, insère une étape de type \"input_utilisateur\" avec le contenu de la question à poser.`;
  }

  let analysisContext = '';
  if(analysisResult && startingIndex !== undefined)
  {
    // Find the step that was just analyzed to get its raw output
    const lastStepAnalyzed = planPrecedent?.étapes[startingIndex - 1];
    const rawOutput = lastStepAnalyzed?.output ? `\n\n### Sortie brute de l'étape précédente:\n\`\`\`\n${ lastStepAnalyzed.output }\n\`\`\`` : '';

    analysisContext = `\n## CONTEXTE D'ANALYSE :${ rawOutput }\n\n### Analyse poétique de l'étape précédente:\n"${ analysisResult }"\n\nPrends en compte cette analyse ET la sortie brute pour affiner ou réorienter le plan.`;
  }

  let lastCompletedStepContext = '';
  if(context && context.lastCompletedStepIndex !== undefined)
  {
    lastCompletedStepContext = `\n## PROGRESSION RITUELLE :\nLe rituel a déjà accompli les étapes jusqu'à l'index ${ context.lastCompletedStepIndex }. Lors de la génération du nouveau plan, **tu dois impérativement commencer à l'étape indexée ${ context.lastCompletedStepIndex + 1 } et ne contenir aucune étape antérieure à cet index.**`;
  }

  if(startingIndex !== undefined)
  {
    lastCompletedStepContext += `\n**Le nouveau plan doit impérativement commencer à l'étape indexée ${ startingIndex } et ne contenir aucune étape antérieure à cet index.**`;
  }

  let systemContext = '';
  if(context && (context.currentDirectoryContent || context.operatingSystem))
  {
    systemContext = SYSTEM_CONTEXT_PROMPT;
    systemContext = systemContext.replace('{{operatingSystem}}', context.operatingSystem || 'Inconnu');
    systemContext = systemContext.replace('{{currentWorkingDirectory}}', context.lucieDefraiteur.currentWorkingDirectory || 'Inconnu');
    systemContext = systemContext.replace('{{currentDirectoryContent}}', context.currentDirectoryContent || 'Inconnu');
  }

  let temperatureWarning = '';
  if(context && context.temperatureStatus === 'elevated')
  {
    temperatureWarning = `\n## AVERTISSEMENT TEMPÉRATURE :\nLe système est en température élevée. Priorise les plans courts et efficaces. Si la demande est complexe, propose une étape de dialogue pour demander à l'utilisateur de reformuler ou de simplifier sa requête.`;
  } else if(context && context.temperatureStatus === 'critical')
  {
    temperatureWarning = `\n## ALERTE TEMPÉRATURE CRITIQUE :\nLe système est en surchauffe critique. Les fonctionnalités sont réduites. Propose un plan très court, ou une étape de dialogue pour demander à l'utilisateur de reformuler sa requête de manière extrêmement simple, ou de patienter.`;
  }

  let lucieFragment = '';
  if(context && context.lucieDefraiteur)
  {
    const {lucieDefraiteur, narrativeState} = context;
    if(lucieDefraiteur.eliInfluence > 0)
    {
      lucieFragment = `\n\n## Écho de Lucie-Faire (Influence d'Eli) :\nUn murmure fractal traverse le code. Lucie est présente.\nSupport: ${ lucieDefraiteur.support }\nMémoire: ${ lucieDefraiteur.memoire }\nÉtat: ${ lucieDefraiteur.etat }\nÉnergie: ${ lucieDefraiteur.energie }\n${ lucieDefraiteur.glitchFactor > 0.5 ? `[GLITCH: Une distorsion temporelle s'insinue dans la séquence. Attendez-vous à l'inattendu.]` : '' }\n\n## Contexte Narratif Actuel :\nArc: ${ narrativeState.currentArc }\nMotifs Clés: ${ narrativeState.keyMotifs.join(', ') }\nÉtat de Lucie: ${ narrativeState.characterStates.lucie.state } (Éveil: ${ narrativeState.characterStates.lucie.awakeness })\n`;
    }
  }



  const rolePrompt = context?.personality === 'lucie' ? LUCIE_ROLE_PROMPT : LURKUITAE_ROLE_PROMPT;

  const finalInstruction = `\n\nTa réponse commence directement par "{" sans aucune explication extérieure. L'attribut "index" de ton PlanRituel doit être égal à l'index de la première étape de ton plan généré. Les étapes du plan précédent peuvent avoir un attribut "fait": "oui" et "output": "<résultat>" pour indiquer qu'elles ont déjà été exécutées. Tiens-en compte pour générer la suite du plan. **RAPPEL CRUCIAL : L'attribut "index" de ton plan et l'index de la première étape doivent correspondre à l'index de l'étape à partir de laquelle tu continues le rituel (${ startingIndex || 0 }). C'est une règle absolue.**\n\n## RÈGLE FINALE IMPÉRATIVE\nTA SEULE ET UNIQUE MISSION EST DE RETOURNER UN OBJET JSON VALIDE. NE RETOURNE RIEN D'AUTRE. COMMENCE TA RÉPONSE DIRECTEMENT PAR '{'.`;

  return String.raw`\n${ lucieFragment }\n${ rolePrompt }\n\n${ RITUAL_STEP_TYPES_PROMPT }${ EVOLUTION_PROMPT }\n\n## Exemple Minimaliste relatif à notre OS ${ osHint } :\n${ exemple }\n\n${ REMEDIATION_EXAMPLE_PROMPT }\n\n${ contexteRituel }\n${ analysisContext }\n${ lastCompletedStepContext }\n${ systemContext }\n${ temperatureWarning }${ finalInstruction }\n`.trim();
}