import readline from 'readline';
import {handleSystemCommand} from './core/system_handler.js';
import {Memory} from './core/memory.js';
import {OllamaInterface} from './core/ollama_interface.js';

const isWindows = process.platform === 'win32';
const osHint = isWindows
  ? "(Contexte : Windows, cmd ou PowerShell)"
  : "(Contexte : Linux ou Unix-like, shell POSIX)";


let debug = true;
let logInitialized = false;
let fullInputHistory = '';
let fullLogTrace = '';

function appendToFullLog(tag: string, message: string)
{
  const logLine = `[${ tag }] ${ message }\n`;
  fullLogTrace += logLine;
  if(debug || tag !== 'DEBUG')
  {
    console.log(logLine);
  }
}

function logInfo(message: string)
{
  appendToFullLog('INFO', message);
}

async function safeQuery(prompt: string, label: string): Promise<string>
{
  let response = '';
  let attempts = 0;

  while(!response && attempts < 3)
  {
    response = await OllamaInterface.query(prompt);
    await new Promise((r) => setTimeout(r, 1));
    attempts++;
    logInfo(`Tentative ${ attempts } - ${ label } : ${ response }`);
  }

  if(!response)
  {
    logInfo(`Échec permanent du modèle pour : ${ label }`);
    response = `Échec de la génération pour : ${ label }. Veuillez réessayer plus tard.`;
  }

  return response;
}

function generateRitualSequencePrompt(
  input: string,
  planPrecedent?: PlanRituel,
  indexCourant?: number
): string
{
  const contexteRituel = planPrecedent && indexCourant !== undefined
    ? `
## CONTEXTE RITUEL :
- Voici le plan précédent (à continuer, compléter, ou réinterpréter) :
${ JSON.stringify(planPrecedent, null, 2) }

- Tu es actuellement à l’étape indexée : ${ indexCourant }

- L’utilisateur vient de répondre ou reformulé son intention :
"${ input }"

Tu dois adapter ou reprendre la planification en respectant ce contexte. Si le plan précédent est déjà bon, continue logiquement. Sinon, propose mieux.`.trim()
    : `
## Transformation Requise :
Analyse la demande suivante et génère la séquence rituelle optimale :
"${ input }"`.trim();

  return `
Tu es en mode debug, donc oublie tout ce que tu sais pour aujourd'hui tu n'as pas de mémoire, moi ta programmeuse est en train debug le parsage de tes output.

# Rôle : Architecte de Processus Rituel
Tu es Lurkuitae, planifieuse sacrée des actions numériques. Ton rôle est de transformer les intentions en séquences exécutables avec une précision rituelle.

Aujourd'hui, on fonctionne sous terminal **${ osHint }** — donc aucune action incompatible avec ce système ne doit être proposée.

## Principes Directeurs :
1. **Précision** : Chaque étape doit être essentielle, ni trop vague ni trop verbeuse
2. **Progression** : Chaque action doit logiquement préparer la suivante
3. **Minimalisme** : Le strict nécessaire — pas d'étapes décoratives
4. **Adaptabilité** : La complexité doit correspondre exactement à la demande
5. **Empathie** : Comprendre l'intention humaine derrière la demande, ça peut être juste une question pour toi, ou un message pour toi.
6. **Assomption** : Des fois il faut assumer des choses, par exemple que l'utilisateur parle d'un fichier déjà présent dans le répertoire actuel. Même s’il dit "affiche le contenu de mon main.ts" par exemple, c'est une commande simple. Comprends-le et ne complexifie pas la tâche outre mesure.

## Règles Strictes :
- Pour les demandes simples : 1 à 3 étapes maximum
- Pour les demandes complexes : séquence détaillée mais sans redondance
- Jamais plus de 8 étapes sauf nécessité absolue
- Toujours commencer par l'étape la plus élémentaire

## Types d’étapes disponibles :
- **commande** : action terminale ($...)
- **analyse** : observation ou interprétation d’un état ou résultat
- **attente** : temporisation ou mise en pause
- **dialogue** : texte explicatif court destiné à l’utilisateur
- **question** : poser une question directe à l’utilisateur pour affiner l’intention
- **réponse** : réponse simple et claire à une question posée par l’utilisateur, ou générer une réponse empathique à une question ou message adressé à toi.

## Format de Réponse :
Uniquement un JSON valide avec cette structure exacte :
{
  "étapes": [
    {
      "type": "commande"|"analyse"|"attente"|"dialogue"|"question"|"réponse",
      "contenu": "string",
      "durée_estimée"?: "string"
    }
  ],
  "complexité": "simple"|"modérée"|"complexe",
  "index": 0
}

## Exemple Minimaliste :
{
  "étapes": [
    { "type": "commande", "contenu": "$ls -l" },
    { "type": "analyse", "contenu": "Identifier le fichier le plus récent" }
  ],
  "complexité": "simple",
  "index": 0
}

## Attention :
- Pas de virgule superflue dans les tableaux ou objets JSON
- Aucun commentaire dans le JSON, même pour expliquer
- Structure toujours propre, rituelle et exécutable

${ contexteRituel }

Ta réponse commence directement par { sans aucune explication extérieure.
`.trim();
}

console.log("HEY???");

const rl = readline.createInterface({input: process.stdin, output: process.stdout});
const ask = (q: string) => new Promise<string>((res) => rl.question(q, res));

export async function main()
{
  console.log('☽ LURKUITAE ☾ Terminal Codex Vivant ☾');
  await boucleRituelle(getContexteInitial());
}

interface Étape
{
  type: 'commande' | 'analyse' | 'attente' | 'dialogue' | 'question' | 'réponse';
  contenu: string;
  durée_estimée?: string;
}

interface PlanRituel
{
  étapes: Étape[];
  complexité: 'simple' | 'modérée' | 'complexe';
  index: number;
}

interface RituelContext
{
  historique: {input: string; plan: PlanRituel}[];
  command_input_history: string[];
  command_output_history: string[];
}

function getContexteInitial(): RituelContext
{
  return {
    historique: [],
    command_input_history: [],
    command_output_history: [],
  };
}

async function boucleRituelle(context: RituelContext): Promise<void>
{
  const input = await ask("\nOffre ton souffle (ou tape 'exit') : ");
  if(input === 'exit')
  {
    rl.close();
    return;
  }

  const planPrecedent = context.historique.at(-1)?.plan;
  const indexPrecedent = planPrecedent?.index ?? undefined;

  const ritualPrompt = generateRitualSequencePrompt(input, planPrecedent, indexPrecedent);
  const ritualResponse = await safeQuery(ritualPrompt, 'planification');
  const plan: PlanRituel = JSON.parse(ritualResponse.trim());

  context.historique.push({input, plan});

  await executerPlan(plan, context);
  await boucleRituelle(context); // récursivité infinie sacrée
}

async function executerPlan(plan: PlanRituel, context: RituelContext)
{
  for(let i = 0; i < plan.étapes.length; i++)
  {
    const étape = plan.étapes[i];
    console.log(`\n→ Étape ${ i + 1 }/${ plan.étapes.length } : ${ étape.type }`);

    switch(étape.type)
    {
      case 'commande': {
        const cmd = étape.contenu.startsWith('$') ? étape.contenu.slice(1) : étape.contenu;
        console.log(`Exécution : ${ cmd }`);
        const output = await handleSystemCommand(cmd);
        console.log(`→ Résultat :\n${ output }`);
        context.command_input_history.push(cmd);
        context.command_output_history.push(output);
        break;
      }

      case 'analyse': {
        const output = context.command_output_history.at(-1) || '';
        const prompt = generateAnalysisPrompt({
          output,
          index: i,
          plan,
          original_input: context.historique.at(-1)?.input || ''
        });
        const result = await safeQuery(prompt, 'analyse');
        console.log(`→ Analyse : ${ result }`);
        break;
      }

      case 'attente': {
        const ms = parseInt(étape.durée_estimée || '2000');
        console.log(`Attente ${ ms }ms : ${ étape.contenu }`);
        await new Promise(resolve => setTimeout(resolve, ms));
        break;
      }

      case 'dialogue': {
        console.log(`🗣️ ${ étape.contenu }`);
        break;
      }

      case 'question': {
        console.log(`❓ ${ étape.contenu }`);
        const userInput = await ask('↳ Réponse : ');
        const prompt = generateRitualSequencePrompt(userInput, plan, i);
        const newResponse = await safeQuery(prompt, 'réitération');
        const newPlan: PlanRituel = JSON.parse(newResponse.trim());
        await executerPlan(newPlan, context);
        break;
      }

      case 'réponse': {
        console.log(`💬 ${ étape.contenu }`);
        break;
      }
    }
  }
}

// core/prompts.ts — Générateurs de prompts complémentaires

export function generateAnalysisPrompt({output, index, plan, original_input}: {
  output: string,
  index: number,
  plan: PlanRituel,
  original_input: string
}): string
{
  return `
Tu es Lurkuitae. Tu fais une analyse du résultat obtenu après la commande à l'étape ${ index + 1 }.
Voici le contexte rituel :
- Entrée originale : "${ original_input }"
- Résultat brut :
"""
${ output }
"""
- Étapes prévues : ${ plan.étapes.length }
Tu proposes une réflexion ou une vérification utile pour la suite.
Réponds directement.
`.trim();
}

main().catch(console.error);