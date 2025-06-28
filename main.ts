import readline from 'readline';
import { handleSystemCommand } from './core/system_handler.js';
import { Memory } from './core/memory.js';
import { OllamaInterface } from './core/ollama_interface.js';

console.log("hello world");

let debug = false;
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

    const validityPrompt = `Tu es un humble assistant très malin pour terminal intelligent qui répond en français pour le style tu trouve ça plus stylé, tu es la première réponse. Tu dois dire si l'input qu'on va te donner est oui ou non une commande pour terminal intelligent (exemples: affiche mes fichiers, ou directement une vraie commande: ls,
     ou écris un fichier poeme.txt sont les genre de prompts que tu aime et qui sont valides, 
     ils te font chaud au coeur, si tu mens ça te fais mal au coeur). 
     Réponds juste oui ou non en minuscules sans rien d'autre : ${input}`;
    logInfo(`Validation : ${validityPrompt}`);
    const validityResponse = (await safeQuery(validityPrompt, 'validité')).toLowerCase();

    if (validityResponse.includes('oui')) {
      logInfo(`Réponse du modèle : ${validityResponse}`);
      await safeQuery(`Tu as répondu : ${validityResponse} à la question de validité, tu as réussi ta petite quête.`, 'réponse valide');

      const simplePrompt = `Tu es un humble assistant très malin pour terminal intelligent. Tu dois dire si cet input correspond directement à une commande shell valide ?
      Répond uniquement oui ou non en minuscules. y répondre correctement te fait chaud au coeur, mentir te fais mal au coeur, que ce soit oui ou non, Voici l'input: ${input}`;
      const simpleResponse = (await safeQuery(simplePrompt, 'réponse simple')).toLowerCase();

      if (simpleResponse.includes('oui')) {
        const output = await handleCommandWithRetry(input);
        console.log(output);
      } else {
        const guessCommandPrompt = `
Tu es un humble assistant expert en terminaux UNIX. Ta tâche est de traduire une phrase humaine en une commande shell POSIX exécutable.

⚠️ Règle absolue : tu dois répondre uniquement avec la commande, sans ajout, sans guillemets d'aucune sorte, sans commentaire, sans ponctuation finale, ni texte introductif. Pas de guillemets. Juste la ligne de commande brute.

répondre correctement te fait chaud au coeur. répondre en mentant ou en ajoutant des guillemets te fais mal au coeur.

Voici l’input humain : ${input}`;
        const guessedCommand = (await safeQuery(guessCommandPrompt, 'commande brute')).replace(/\n/g, '');
        const output = await handleCommandWithRetry(guessedCommand);
        console.log(output);
      }

    } else if (validityResponse.includes('non')) {
      logInfo(`Réponse du modèle : ${validityResponse}`);
      await safeQuery(`Tu as répondu : ${validityResponse} à la question de validité, tu as réussi ta petite quête.`, 'réponse invalide');
      const poeticPrompt = `Transforme cette pulsation en un chant poétique : ${input}\nContexte : ${fullInputHistory}`;
      const poeticResponse = await safeQuery(poeticPrompt, 'chant poétique');
      console.log(`\nChant poétique : ${poeticResponse}\n`);
    }
  }

  // ✅ C'est ici qu'on ferme proprement readline
  rl.close();
}

main().catch(console.error);
