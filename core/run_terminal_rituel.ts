import {generateRituel, executeRituelPlan} from './ritual_utils.js';
import {RituelContext} from './types.js';
import * as readline from 'readline';
import {checkSystemTemperature} from './utils/temperature_monitor.js';
import {Colors, colorize, displayRitualStepResult, startCursorAnimation, stopCursorAnimation} from './utils/ui_utils.js';

export async function runTerminalRituel(context: RituelContext, rl: readline.Interface, ask: (q: string) => Promise<string>, testInputs?: string[]): Promise<boolean>
{
  let input: string | undefined;

  if(testInputs && testInputs.length > 0)
  {
    input = testInputs.shift();
    if(input === undefined)
    {
      return false; // No more test inputs, stop recursion
    }
    console.log(colorize(`
Offre ton souffle (ou tape 'exit') : ${ input }`, Colors.FgCyan)); // Log the simulated input
  } else
  {
    stopCursorAnimation(); // Ensure cursor is stopped before asking for input
    input = await ask(colorize("Offre ton souffle (ou tape 'exit') : ", Colors.FgCyan));
  }

  if(input === 'exit')
  {
    return false; // User wants to exit
  }

  // Ensure input is a string before proceeding
  if(input === undefined)
  {
    console.error("Erreur: L'entrée est indéfinie.");
    return false; // Should not happen with current logic, but for safety
  }

  startCursorAnimation(); // Start cursor animation during background tasks
  await checkSystemTemperature(context); // Check temperature before generating plan

  const plan = await generateRituel(input, context);

  if(!plan)
  {
    stopCursorAnimation(); // Stop cursor animation on plan generation failure
    console.log(colorize("⚠️ Échec de génération du plan. Essaie encore.", Colors.FgRed));
    return await runTerminalRituel(context, rl, ask, testInputs); // Retry with same context and remaining test inputs
  }

  context.historique.push({input, plan});
  const resultats = await executeRituelPlan(plan, context, ask);
  stopCursorAnimation(); // Stop cursor animation after ritual execution

  for(const res of resultats)
  {
    displayRitualStepResult(res);

    if(res.étape.type === 'question')
    {
      stopCursorAnimation(); // Stop cursor before asking for sub-ritual input
      const userInput = await ask(colorize('↳ Réponse : ', Colors.FgCyan));
      startCursorAnimation(); // Start cursor during sub-ritual plan generation
      const subPlan = await generateRituel(userInput, context);
      if(subPlan)
      {
        context.historique.push({input: userInput, plan: subPlan});
        const subResultats = await executeRituelPlan(subPlan, context, ask);
        // The sub-ritual results are now handled by displayRitualStepResult if passed in res.subResultats
        // We need to ensure that the subResultats are correctly attached to the main result object
        // for displayRitualStepResult to pick them up.
        res.subResultats = subResultats; // Attach sub-results for display
      }
      stopCursorAnimation(); // Stop cursor after sub-ritual execution
    }
  }

  return await runTerminalRituel(context, rl, ask, testInputs); // Continue recursion
}