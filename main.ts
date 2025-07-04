import {getContexteInitial} from './core/ritual_utils.js';
import {runTerminalRituel} from './core/run_terminal_rituel.js';
import * as readline from 'readline';
import {demonstrateCursorControl} from './core/utils/ui_utils.js';
import {OllamaModel} from './core/ollama_interface.js';
import {parse} from './core/permissive_parser/index.js';


console.log('☽ LURKUITAE ☾ Terminal Codex Vivant ☾');

const rl = readline.createInterface({input: process.stdin, output: process.stdout});
const ask = (q: string) => new Promise<string>((res) => rl.question(q, res));

// Determine the model from command line arguments
const args = process.argv.slice(2);
let model: OllamaModel = OllamaModel.Mistral; // Default model
let chantModeEnabled: boolean = false;
let personality: 'lurkuitae' | 'lucie' = 'lurkuitae'; // Default personality

const modelArgIndex = args.indexOf('--model');
const chantModeArgIndex = args.indexOf('--chant-mode');
const modeArgIndex = args.indexOf('--mode');

if(chantModeArgIndex > -1)
{
  chantModeEnabled = true;
}

if(modeArgIndex > -1 && args[modeArgIndex + 1])
{
  const requestedMode = args[modeArgIndex + 1];
  if(requestedMode === 'lucie')
  {
    personality = 'lucie';
  }
}

if(modelArgIndex > -1 && args[modelArgIndex + 1])
{
  const requestedModel = args[modelArgIndex + 1];
  if(Object.values(OllamaModel).includes(requestedModel as OllamaModel))
  {
    model = requestedModel as OllamaModel;
  } else if(requestedModel === 'random')
  {
    const models = Object.values(OllamaModel);
    model = models[Math.floor(Math.random() * models.length)];
  }
}

try
{
  const context = getContexteInitial();
  context.chantModeEnabled = chantModeEnabled;
  context.personality = personality;
  //demonstrateCursorControl(); // Call the demonstration function
  // Give some time to see the demonstration before the ritual starts
  //await new Promise(resolve => setTimeout(resolve, 5000));
  const testInputs = [
    "create a folder named my_website",
    "go to my_website",
    "create index.html with content: <h1>Hello, World!</h1><link rel=\"stylesheet\" href=\"style.css\"><script src=\"script.js\"></script>",
    "create style.css with content: body { background-color: lightblue; }",
    "create script.js with content: console.log(\"Hello from JavaScript!\");",
    "verify that index.html, style.css, and script.js exist",
    "show me the content of index.html",
    "exit"
  ];
  await runTerminalRituel(context, rl, ask, undefined, model);
} catch(err)
{
  console.error("[ERREUR FATALE]", err);
} finally
{
  rl.close();
}