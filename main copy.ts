
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
  return JSON.stringify(str).slice(1, -1); // échappe comme string JSON
}

async function main() {
  console.log('☽ LURKUITAE ☾ Terminal Codex Vivant ☾ (LLM Local + Mémoire + Shell + Rêverie)');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const ask = (q: string) => new Promise<string>((res) => rl.question(q, res));

  while (true) {
    const input = await ask("\nOffre ton souffle (ou tape 'exit') : ");
    if (input === 'exit') break;

    fullInputHistory += `\n> ${input}`;

    const validityPrompt = `Tu es un ai assistant très malin pour terminal intelligent, tu es la premiere réponse, tu dois dire si 
    l'input qu'on va te donner est oui ou non une commande pour terminal intelligent ? Réponds juste oui ou non en minuscules sans rien d'autre s'ilteplait sinon on peut pas aller plus loin : ${input}`;
    logInfo(`Validation : ${validityPrompt}`);
   
    
    const validityResponse = (await safeQuery(validityPrompt, 'validité')).toLowerCase();
    console.log("validity:" + validityResponse);
    if (validityResponse.indexOf('oui') >= 0)
    {
      logInfo(`Réponse du modèle : ${validityResponse}`);
      console.log("Réponse du modèle, on continue.");
      await safeQuery(`Tu as répondu : ${validityResponse} à la question de validité, tu as reussi ta petite quete quotidienne.`, 'réponse valide');
      //const simplePrompt = `Réponds simplement à la pulsation : ${input}\nContexte : ${fullInputHistory}`;
      //const simpleResponse = await safeQuery(simplePrompt, 'réponse simple');
      //console.log("simpleResponse:" + simpleResponse);

      const simplePrompt = `Tu es un assistant ai très malin pour terminal intelligent, est ce que cet input correspond directement à une commande shell valide? répond uniquement oui ou non en minuscule de préférence, voici l'input: ` + input;
      console.log("simplePrompt:" + simplePrompt);
      const simpleResponse = (await safeQuery(simplePrompt, 'réponse simple')).toLowerCase();
      console.log("simpleResponse:" + simpleResponse);
      if (simpleResponse.indexOf('oui') >= 0 )
      {
        const output = await handleCommandWithRetry(input);
        console.log(output);
      }
      else
      {

        const guessCommandPrompt = `
        Tu es un assistant IA expert en terminaux UNIX. Ta tâche est de traduire une phrase humaine en une commande shell POSIX exécutable.

        ⚠️ Règle absolue : tu dois répondre **uniquement** avec la commande, sans ajout, sans commentaire, sans ponctuation finale, ni texte introductif. Pas de guillemets non plus. Juste la ligne de commande brute.

        Si tu n'es pas sûr, produis quand même la commande la plus probable.

        Voici l’input humain : ${input}
        `;
        console.log("guessCommandPrompt:" + guessCommandPrompt);
        const guessedCommand = (await safeQuery(guessCommandPrompt, 'commande brute')).replace(/\n/g, '');
        console.log("guessedCommand:" + guessedCommand);
        const output = await handleCommandWithRetry(guessedCommand);
        console.log(output);
      }

      /*
      
      const output = await handleCommandWithRetry(guessedCommand);
      console.log(`Incantation : ${guessedCommand}\nRésultat:\n${output}\n\n`);
      */
    }
    else if (validityResponse.indexOf('non') >= 0)
    {
      logInfo(`Réponse du modèle : ${validityResponse}`);
      console.log("Réponse du modèle, on continue.");
      await safeQuery(`Tu as répondu : ${validityResponse} à la question de validité, tu as reussi ta petite quete quotidienne.`, 'réponse valide');
      const poeticPrompt = `Transforme cette pulsation en un chant poétique : ${input}\nContexte : ${fullInputHistory}`;
      const poeticResponse = await safeQuery(poeticPrompt, 'chant poétique');
      console.log("poeticResponse:" + poeticResponse);
      console.log(`Chant poétique : ${poeticResponse}\n\n`);
    }
    rl.close();
}
}

main().catch(console.error);