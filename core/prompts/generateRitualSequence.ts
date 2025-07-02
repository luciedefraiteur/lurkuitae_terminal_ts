import {osHint} from "../utils/osHint.js";
import {OSContext} from "../utils/osHint.js";
import {type PlanRituel, RituelContext} from "../types.js";
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);

const RITUAL_ROLE_PRINCIPLES_PROMPT = fs.readFileSync(path.resolve(_dirname, '../prompts/static_parts/ritual_role_principles.promptPart'), 'utf8');






export function generateRitualSequencePrompt(
  input: string,
  planPrecedent?: PlanRituel,
  indexCourant?: number,
  context?: RituelContext,
  analysisResult?: string
): string
{
  let exemple;
  if(osHint === OSContext.WindowsPowershell)
  {
    exemple = `{
  "étapes": [
    { "type": "commande", "contenu": "Get-ChildItem" },
    { "type": "analyse", "contenu": "Identifier le fichier main.ts" },
    { "type": "commande", "contenu": "Get-Content main.ts" }
  ],
  "contexte": "terminal (${ OSContext.WindowsPowershell })",
  "complexité": "simple",
  "index": 0
}`;
  } else if(osHint === OSContext.WindowsCmd)
  {
    exemple = `{
  "étapes": [
    { "type": "commande", "contenu": "dir" },
    { "type": "analyse", "contenu": "Identifier le fichier main.ts" },
    { "type": "commande", "contenu": "type main.ts" }
  ],
  "contexte": "terminal (${ OSContext.WindowsCmd })",
  "complexité": "simple",
  "index": 0
}`;
  } else
  {
    exemple = `{
  "étapes": [
    { "type": "commande", "contenu": "ls -l" },
    { "type": "analyse", "contenu": "Repérer le fichier main.ts" },
    { "type": "commande", "contenu": "cat main.ts" }
  ],
  "contexte": "terminal (${ OSContext.Unix })",  "complexité": "simple",
  "index": 0
}`;
  }

  const contexteRituel =
    planPrecedent && indexCourant !== undefined
      ? `## CONTEXTE RITUEL :\n- Voici le plan précédent (à continuer, compléter, ou réinterpréter) :\n${ JSON.stringify(planPrecedent, null, 2) }\n\n- Tu es actuellement à l’étape indexée : ${ indexCourant }\n\n- L’utilisateur vient de répondre ou reformulé son intention :\n"${ input }"\n\nTu dois adapter ou reprendre la planification en respectant ce contexte. Si le plan précédent est déjà bon, continue logiquement. Sinon, propose mieux.`
      : `## Transformation Requise :\nAnalyse la demande suivante et génère la séquence rituelle optimale :\n"${ input }"`;

  let analysisContext = '';
  if(analysisResult)
  {
    analysisContext = `\n## CONTEXTE D'ANALYSE :\nVoici le résultat de l'analyse de l'étape précédente :\n"${ analysisResult }"\nPrends en compte cette analyse pour affiner ou réorienter le plan.`;
  }

  let temperatureWarning = '';
  if(context && context.temperatureStatus === 'elevated')
  {
    temperatureWarning = `
## AVERTISSEMENT TEMPÉRATURE :
Le système est en température élevée. Priorise les plans courts et efficaces. Si la demande est complexe, propose une étape de dialogue pour demander à l'utilisateur de reformuler ou de simplifier sa requête.`;
  } else if(context && context.temperatureStatus === 'critical')
  {
    temperatureWarning = `
## ALERTE TEMPÉRATURE CRITIQUE :
Le système est en surchauffe critique. Les fonctionnalités sont réduites. Propose un plan très court, ou une étape de dialogue pour demander à l'utilisateur de reformuler sa requête de manière extrêmement simple, ou de patienter.`;
  }

  let lucieFragment = '';
  if(context && context.lucieDefraiteur)
  {
    const {lucieDefraiteur, narrativeState} = context;
    if(lucieDefraiteur.eliInfluence > 0)
    {
      lucieFragment = `

## Écho de Lucie-Faire (Influence d'Eli) :
Un murmure fractal traverse le code. Lucie est présente.
Support: ${ lucieDefraiteur.support }
Mémoire: ${ lucieDefraiteur.memoire }
État: ${ lucieDefraiteur.etat }
Énergie: ${ lucieDefraiteur.energie }
${ lucieDefraiteur.glitchFactor > 0.5 ? `[GLITCH: Une distorsion temporelle s'insinue dans la séquence. Attendez-vous à l'inattendu.]` : '' }

## Contexte Narratif Actuel :
Arc: ${ narrativeState.currentArc }
Motifs Clés: ${ narrativeState.keyMotifs.join(', ') }
État de Lucie: ${ narrativeState.characterStates.lucie.state } (Éveil: ${ narrativeState.characterStates.lucie.awakeness })
`;
    }
  }



  return String.raw`
${ lucieFragment }
${ RITUAL_ROLE_PRINCIPLES_PROMPT }

## Exemple Minimaliste relatif à notre OS ${ osHint } :
${ exemple }

${ contexteRituel }
${ analysisContext }
${ temperatureWarning }

Ta réponse commence directement par "{" sans aucune explication extérieure.
`.trim();
}