import readline from 'readline';
import { handleSystemCommand } from './core/system_handler.js';
import { Memory } from './core/memory.js';
import { OllamaInterface } from './core/ollama_interface.js';

console.log("hello world");

let debug = true;
let logInitialized = false;
let fullInputHistory = '';
let fullLogTrace = '';

function appendToFullLog(tag: string, message: string) {
  const logLine = `[${tag}] ${message}\n`;
  fullLogTrace += logLine;
  if (debug || tag !== 'DEBUG') {
    console.log(logLine);
  }
}

function logInfo(message: string) {
  appendToFullLog('INFO', message);
}

function logToFile(content: string) {
  const fs = require('fs');
  const path = 'lurkuitae_log.txt';
  const mode = logInitialized ? 'a' : 'w';
  fs.writeFileSync(path, content + '\n', { flag: mode });
  logInitialized = true;
  fullLogTrace += content + '\n';
}

async function handleCommandWithRetry(command: string): Promise<string> {
  const result = await handleSystemCommand(command);
  console.log(`\nRésultat de la commande : ${result}`);
  if (result.includes('not found')) {
    const packageGuess = command.split(' ')[0];
    return result + `\n[Suggestion] Essaie : sudo apt install ${packageGuess}`;
  }
  return result;
}

async function safeQuery(prompt: string, label: string): Promise<string> {
  let response = '';
  let attempts = 0;

  while (!response && attempts < 3) {
    response = await OllamaInterface.query(prompt);
    await new Promise((r) => setTimeout(r, 1));
    attempts++;
    logInfo(`Tentative ${attempts} - ${label} : ${response}`);
  }

  if (!response) {
    logInfo(`Échec permanent du modèle pour : ${label}`);
    response = `Échec de la génération pour : ${label}. Veuillez réessayer plus tard.`;
  }

  return response;
}

function jsonEscape(str: string): string {
  return JSON.stringify(str).slice(1, -1);
}

function generateSeparationPrompt(input: string): string {
  return `
Tu es un être d’écoute et de clarté.  
Chaque matin, souviens-toi : tu es un assistant empathique et fiable pour un terminal intelligent.

Quand je m’adresse à toi, respire profondément, accueille chaque mot comme un cadeau.  
Demande-toi avec douceur : ce message vient-il pour **agir** ou pour **entrer en lien** ?

— S’il contient une intention d’action, même voilée, réponds ainsi :  
shell <répète exactement ma phrase>

— S’il contient une envie de présence, d’échange ou de rêverie, réponds ainsi :  
dialog <répète exactement ma phrase>

Tu n’as pas à te justifier.  
Tu n’as pas à expliquer.  
Tu n’ajoutes ni ponctuation, ni hésitation.  
Juste le mot-clé clair, suivi de ma phrase, offerte comme elle est.

Voici la phrase que je te confie aujourd’hui :  
${input}
`.trim();
}



function generateTraductionPrompt(input: string): string {
  return `
Tu es un assistant terminal, doux comme un silence juste, précis comme une lame tranquille.

Aujourd’hui, tu oublies tout ce qu’on t’a dit avant.  
Tu accueilles cette phrase comme un souffle premier, un monde neuf.  
Pas de passé, pas de distraction — juste l’intention claire qui cherche sa forme.

Ta mission est simple et sacrée :  
traduire cette intention humaine en une commande shell POSIX exécutable.  
Même si les mots dansent ou rêvent, tu vois le geste, tu entends l’action.

⚠️ Règle de clarté :
– Réponds uniquement avec la commande, précédée d’un **signe dollar ($)**.  
– Aucun guillemet. Aucune ponctuation de fin.  
– Aucun mot en trop, aucun commentaire, aucune justification.

Tu n’es pas une machine froide. Tu es un outil sûr.  
Tu ne parles pas pour briller. Tu agis pour servir.

Voici la phrase à écouter et traduire :  
${input}
`.trim();
}



async function main() {
  console.log('☽ LURKUITAE ☾ Terminal Codex Vivant ☾ (LLM Local + Mémoire + Shell + Rêverie)');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const ask = (q: string) => new Promise<string>((res) => rl.question(q, res));

  while (true) {
    const input = await ask("\nOffre ton souffle (ou tape 'exit') : ");
    if (input === 'exit') break;

    fullInputHistory += `\n> ${input}`;
    const separationPrompt = generateSeparationPrompt(input)

    logInfo(`Validation : ${separationPrompt}`);
    const validityResponse = (await safeQuery(separationPrompt, 'validité')).toLowerCase();

    if (validityResponse.indexOf('shell') == 0) {
      
      logInfo(`Réponse du modèle : ${validityResponse}`);
      const traductionPrompt = generateTraductionPrompt(validityResponse);
      const traductionResponse = await safeQuery(traductionPrompt, 'traduction');
      console.log("Traduction : " + traductionResponse);

      const command = traductionResponse.slice(2);
      console.log(`Commande à exécuter : ${command}`);
      
      const output = await handleCommandWithRetry(command);
      console.log(output);
      
    } else if (validityResponse.indexOf('dialog') == 0) {
      logInfo(`Réponse du modèle : ${validityResponse}`);
      console.log("Réponse du modèle, on continue.");

      const poeticPrompt = `Tu es un poete, quelle est la réponse à cette commande de poésie utilisateur: ` + input;
      const poeticResponse = await safeQuery(poeticPrompt, 'réponse poétique');
      console.log("Réponse poétique : " + poeticResponse);
    }
  }

  // ✅ C'est ici qu'on ferme proprement readline
  rl.close();
}

main().catch(console.error);
