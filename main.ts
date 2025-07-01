import { getContexteInitial } from './core/ritual_utils.js';
import { runTerminalRituel } from './core/run_terminal_rituel.js';
import * as readline from 'readline';
import { demonstrateCursorControl } from './core/utils/ui_utils.js';

console.log('☽ LURKUITAE ☾ Terminal Codex Vivant ☾');

const rl = readline.createInterface({input: process.stdin, output: process.stdout});
const ask = (q: string) => new Promise<string>((res) => rl.question(q, res));

try {
  const context = getContexteInitial();
  demonstrateCursorControl(); // Call the demonstration function
  // Give some time to see the demonstration before the ritual starts
  await new Promise(resolve => setTimeout(resolve, 5000));
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
  await runTerminalRituel(context, rl, ask);
} catch (err) {
  console.error("[ERREUR FATALE]", err);
} finally {
  rl.close();
}