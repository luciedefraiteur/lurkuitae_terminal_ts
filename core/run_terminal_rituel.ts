import {generateRituel, executeRituelPlan} from './ritual_utils.js';
import {RituelContext} from './types.js';
import * as readline from 'readline';

// ANSI escape codes for colors
const Colors = {
  Reset: "\x1b[0m",
  Bright: "\x1b[1m",
  Dim: "\x1b[2m",
  Underscore: "\x1b[4m",
  Blink: "\x1b[5m",
  Reverse: "\x1b[7m",
  Hidden: "\x1b[8m",

  FgBlack: "\x1b[30m",
  FgRed: "\x1b[31m",
  FgGreen: "\x1b[32m",
  FgYellow: "\x1b[33m",
  FgBlue: "\x1b[34m",
  FgMagenta: "\x1b[35m",
  FgCyan: "\x1b[36m",
  FgWhite: "\x1b[37m",

  BgBlack: "\x1b[40m",
  BgRed: "\x1b[41m",
  BgGreen: "\x1b[42m",
  BgYellow: "\x1b[43m",
  BgBlue: "\x1b[44m",
  BgMagenta: "\x1b[45m",
  BgCyan: "\x1b[46m",
  BgWhite: "\x1b[47m",
};

function colorize(text: string, color: string): string
{
  return `${ color }${ text }${ Colors.Reset }`;
}

export async function runTerminalRituel(context: RituelContext, rl: readline.Interface, ask: (q: string) => Promise<string>, testInputs?: string[]): Promise<boolean> {
  let input: string | undefined;

  if (testInputs && testInputs.length > 0) {
    input = testInputs.shift();
    if (input === undefined) {
      return false; // No more test inputs, stop recursion
    }
    console.log(colorize(`\nOffre ton souffle (ou tape 'exit') : ${input}`, Colors.FgCyan)); // Log the simulated input
  } else {
    input = await ask(colorize("\nOffre ton souffle (ou tape 'exit') : ", Colors.FgCyan));
  }

  if (input === 'exit') {
    return false; // User wants to exit
  }

  // Ensure input is a string before proceeding
  if (input === undefined) {
    console.error("Erreur: L'entrée est indéfinie.");
    return false; // Should not happen with current logic, but for safety
  }

  const plan = await generateRituel(input, context);

  if(!plan)
  {
    console.log(colorize("⚠️ Échec de génération du plan. Essaie encore.", Colors.FgRed));
    return await runTerminalRituel(context, rl, ask, testInputs); // Retry with same context and remaining test inputs
  }

  context.historique.push({input, plan});
  const resultats = await executeRituelPlan(plan, context);

  for(const res of resultats)
  {
    const {étape, index, output, analysis, waited, text} = res;

    console.log(colorize(`\n→ Étape ${ index + 1 } : ${ étape.type }`, Colors.FgCyan));
    if(étape.type === 'commande')
    {
      console.log(colorize(`Exécution : ${ étape.contenu }`, Colors.FgYellow));
      if(res.success)
      {
        console.log(colorize(`→ Résultat :\n${ output }`, Colors.FgGreen));
      } else
      {
        console.log(colorize(`→ Échec (Code: ${ res.exitCode }) :\n${ res.stderr || res.output }`, Colors.FgRed));
      }
    }

    if(étape.type === 'analyse' && analysis)
    {
      console.log(colorize(`→ Analyse : ${ analysis }`, Colors.FgMagenta));
    }

    if(étape.type === 'attente' && waited)
    {
      console.log(colorize(`⏳ Attente ${ waited } ms : ${ étape.contenu }`, Colors.FgBlue));
    }

    if(['dialogue', 'réponse'].includes(étape.type) && text)
    {
      console.log(`💬 ${ text }`); // Default color (white)
    }

    if(étape.type === 'question')
    {
      console.log(colorize(`❓ ${ étape.contenu }`, Colors.FgYellow));
      const userInput = await ask(colorize('↳ Réponse : ', Colors.FgCyan));
      const subPlan = await generateRituel(userInput, context);
      if(subPlan)
      {
        context.historique.push({input: userInput, plan: subPlan});
        const subResultats = await executeRituelPlan(subPlan, context);
        for(const subRes of subResultats)
        {
          console.log(colorize(`→ ${ subRes.étape.type } (${ subRes.index }) → ${ subRes.output || subRes.analysis || subRes.text || '' }`, Colors.FgGreen));
        }
      }
    }
  }

  return await runTerminalRituel(context, rl, ask, testInputs); // Continue recursion
}

