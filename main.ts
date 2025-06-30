import readline from 'readline';
import {handleSystemCommand} from './core/system_handler.js';
import {Memory} from './core/memory.js';
import {OllamaInterface} from './core/ollama_interface.js';
import {generateRitualSequencePrompt, PlanRituel} from './current_prompts/generateRitualSequence.js';
import {generateAnalysisPrompt} from "./current_prompts/generateAnalysisPrompt.js";
let debug = true;
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

const rl = readline.createInterface({input: process.stdin, output: process.stdout});
const ask = (q: string) => new Promise<string>((res) => rl.question(q, res));

export async function main()
{
  console.log('☽ LURKUITAE ☾ Terminal Codex Vivant ☾');
  await boucleRituelle(getContexteInitial());
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
        /* ensuite on doit simplement relancer le rituel avec des arguments sépciaux encore une fois, contenant, le plan en cours, 
          les actions effectuées dans le plan et leur resultat a chaque fois, meme les questions et réponses,
          dans un json
          { 
            inputInitialUTilisateur,
            planEnCours mais détaillé avec chaque réponse aux questions, et chaque output de commande, et chaque resultat d'analyse précédentes.

          }

        */
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



main().catch(console.error);