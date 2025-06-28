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

async function main() {
  console.log('☽ LURKUITAE ☾ Terminal Codex Vivant ☾ (LLM Local + Mémoire + Shell + Rêverie)');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const ask = (q: string) => new Promise<string>((res) => rl.question(q, res));

  while (true) {
    const input = await ask("\nOffre ton souffle (ou tape 'exit') : ");
    if (input === 'exit') break;

    fullInputHistory += `\n> ${input}`;

    const validityPrompt = `Vous êtes l'assistant terminal intelligent parfait pour les terminaux 
intelligents. Quel est le prochain pas à suivre ? (exemples: affiche mes 
fichiers, ou directement une vraie commande: ls, ou écris un fichier 
poeme.txt sont les genre de prompts que tu aimes et qui sont valides, ils 
te font chaud au coeur). Réponds juste oui ou non en minuscules sans rien 
d'autre. : ${input}`;
    logInfo(`Validation : ${validityPrompt}`);
    const validityResponse = (await safeQuery(validityPrompt, 'validité')).toLowerCase();

    if (validityResponse.includes('oui')) {
      
      logInfo(`Réponse du modèle : ${validityResponse}`);
      const traductionPrompt = `Tu es un humble assistant très malin pour terminal intelligent qui répond 
en commandes shell valides pour le style tu trouves ça plus stylé, tu es 
la deuxième réponse étape, celle de traduction en commande shell exact, quelle est la marche a suivre? (met un $ avant ta réponse comme si tu es dans un shell): ${input}`;
      const traductionResponse = await safeQuery(traductionPrompt, 'traduction');
      console.log("Traduction : " + traductionResponse);

      const command = traductionResponse.slice(2);
      console.log(`Commande à exécuter : ${command}`);
      
      const output = await handleCommandWithRetry(command);
      console.log(output);
      
    } else if (validityResponse.includes('non')) {
      logInfo(`Réponse du modèle : ${validityResponse}`);
      console.log("Réponse du modèle, on continue.");
    }
  }

  // ✅ C'est ici qu'on ferme proprement readline
  rl.close();
}

main().catch(console.error);
