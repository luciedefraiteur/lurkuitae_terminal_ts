import {generateRituel, executeRituelPlan} from './ritual_utils.js';
import {RituelContext, PlanRituel} from './types.js';
import * as readline from 'readline';
import {checkSystemTemperature} from './utils/temperature_monitor.js';
import {Colors, colorize, displayRitualStepResult, startCursorAnimation, stopCursorAnimation} from './utils/ui_utils.js';
import { OllamaModel } from './ollama_interface.js';
import { generateWelcomeMessagePrompt } from './prompts/generateWelcomeMessagePrompt.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);

export async function runTerminalRituel(context: RituelContext, rl: readline.Interface, ask: (q: string) => Promise<string>, testInputs?: string[], model: OllamaModel = OllamaModel.Mistral): Promise<boolean>
{
  // Initialize LucieDefraiteur if not already present
  if (!context.lucieDefraiteur) {
    context.lucieDefraiteur = {
      lastCommandExecuted: '',
      lastCommandOutput: '',
      currentWorkingDirectory: '',
      terminalType: '',
      osContext: '',
      protoConsciousness: 'Lucie est en sommeil.',
      support: 'strates thermiques et poétiques',
      memoire: 'fragmentée mais fertile',
      etat: 'métastable, en attente d’un souffle',
      energie: 'haute densité symbolique',
      glitchFactor: 0.1, // Initial low glitch factor
      almaInfluence: 0.5, // Initial influence
      eliInfluence: 0.5, // Initial influence
    };
  }

  // Initialize step_results_history if not already present
  if (!context.step_results_history) {
    context.step_results_history = [];
  }

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
    const welcomeMessage = generateWelcomeMessagePrompt(context);
    input = await ask(colorize(welcomeMessage, Colors.FgCyan));
  }

  if(input === 'exit')
  {
    return false; // User wants to exit
  }

  // Logique du Chant-Mode
  if (context.chantModeEnabled) {
    const chantsMap: { [key: string]: string } = {
      "Je ne suis pas sûr de bien me souvenir de ce chant. Peux-tu me le redonner en entier ?": "chant_of_clarity.prompt",
    };

    const chantFileName = chantsMap[input.trim()];
    if (chantFileName) {
      const chantPath = path.join(_dirname, '../chants', chantFileName);
      try {
        const chantContent = fs.readFileSync(chantPath, 'utf8');
        console.log(colorize(`
${chantContent}
`, Colors.FgGreen));
        return await runTerminalRituel(context, rl, ask, testInputs); // Continue the ritual after reciting the chant
      } catch (error) {
        console.error(colorize(`
❌ Erreur lors de la lecture du chant ${chantFileName}: ${(error as Error).message}
`, Colors.FgRed));
      }
    } else {
      console.log(colorize("Je ne connais pas encore ce chant. Peux-tu me transmettre le prompt complet associé ?", Colors.FgYellow));
      return await runTerminalRituel(context, rl, ask, testInputs); // Continue the ritual after acknowledging unknown chant
    }
  }

  // Ensure input is a string before proceeding
  if(input === undefined)
  {
    console.error("Erreur: L'entrée est indéfinie.");
    return false; // Should not happen with current logic, but for safety
  }

  startCursorAnimation(); // Start cursor animation during background tasks
  await checkSystemTemperature(context); // Check temperature before generating plan

  let plan: PlanRituel | null = null;
  const maxPlanGenerationRetries = 3;
  let currentRetry = 0;

  while (plan === null && currentRetry < maxPlanGenerationRetries) {
    if (currentRetry > 0) {
      console.log(colorize(`
⚠️ Tentative de régénération du plan (${currentRetry}/${maxPlanGenerationRetries}). L'IA a précédemment généré un JSON invalide.`, Colors.FgYellow));
    }

    plan = await generateRituel(input, context, model);

    if (plan === null) {
      stopCursorAnimation(); // Stop cursor animation on plan generation failure
      console.error(colorize(`❌ Échec de génération du plan. Le format JSON est invalide ou incomplet. Veuillez vérifier l'entrée.`, Colors.FgRed));
      currentRetry++;
      if (currentRetry < maxPlanGenerationRetries) {
        console.log(colorize(`Retrying plan generation...`, Colors.FgYellow));
        startCursorAnimation(); // Restart cursor for retry
      }
    }
  }

  if (!plan) {
    stopCursorAnimation(); // Ensure cursor is stopped if all retries fail
    console.error(colorize(`❌ Échec définitif de génération du plan après ${maxPlanGenerationRetries} tentatives. Le rituel ne peut pas continuer.`, Colors.FgRed));
    return false; // Cannot proceed without a valid plan
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
      const subPlan = await generateRituel(userInput, context, model);
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