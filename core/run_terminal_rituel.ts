import {generateRituel, executeRituelPlan} from './ritual_utils.js';
import {RituelContext, PlanRituel} from './types.js';
import * as readline from 'readline';
import {checkSystemTemperature} from './utils/temperature_monitor.js';
import {Colors, colorize, displayRitualStepResult, startCursorAnimation, stopCursorAnimation} from './utils/ui_utils.js';
import {OllamaModel} from './ollama_interface.js';
import {calculateEmotion, interpretEmotion} from './emotional_core.js';
import {appendToVector, enterReverie} from './memory_weaver.js';
import {generateWelcomeMessagePrompt} from './prompts/generateWelcomeMessagePrompt.js';
import fs from 'fs';
import * as os from 'os';
import * as fsPromises from 'fs/promises';
import path from 'path';
import {fileURLToPath} from 'url';

const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);

export async function runTerminalRituel(context: RituelContext, rl: readline.Interface, ask: (q: string) => Promise<string>, testInputs?: string[], model: OllamaModel = OllamaModel.Mistral): Promise<boolean>
{
  // --- Emotional Awakening ---
  context.emotionalState = calculateEmotion(context);

  // Initialize LucieDefraiteur if not already present
  if(!context.lucieDefraiteur)
  {
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
  if(!context.step_results_history)
  {
    context.step_results_history = [];
  }

  let initialInputReceived = false;
  let lastAnalysisResult: string | undefined = undefined;

  while(true)
  {
    let inputForPlanGeneration: string | undefined;

    if(!initialInputReceived)
    {
      let initialUserInput: string | undefined;
      if(testInputs && testInputs.length > 0)
      {
        initialUserInput = testInputs.shift();
        if(initialUserInput === undefined)
        {
          return false; // No more test inputs, stop recursion
        }
        console.log(colorize(`
Offre ton souffle (ou tape 'exit') : ${ initialUserInput }`, Colors.FgCyan)); // Log the simulated input
      } else
      {
        stopCursorAnimation(); // Ensure cursor is stopped before asking for input
        const emotionalInterpretation = await interpretEmotion(context.emotionalState);
        console.log(colorize(`
${ emotionalInterpretation }`, Colors.FgMagenta));

        const welcomeMessage = generateWelcomeMessagePrompt(context);
        initialUserInput = await ask(colorize(welcomeMessage, Colors.FgCyan));
      }
      initialInputReceived = true;
      lastAnalysisResult = initialUserInput; // First input is the initial analysis result
      inputForPlanGeneration = "Analyse de l'intention initiale de l'utilisateur";
    } else if(lastAnalysisResult !== undefined)
    {
      // If there's a pending analysis result from a previous input_utilisateur step
      inputForPlanGeneration = "Analyse de la réponse utilisateur"; // Generic input for plan generation
    } else
    {
      // This branch should ideally not be reached if logic is correct
      console.error("Erreur: Aucune entrée utilisateur ou résultat d'analyse disponible.");
      return false;
    }

    if(inputForPlanGeneration === 'exit')
    {
      return false; // User wants to exit
    }

    // Logique du Chant-Mode (reste inchangée pour l'instant)
    if(context.chantModeEnabled)
    {
      const chantsMap: {[key: string]: string} = {
        "Je ne suis pas sûr de bien me souvenir de ce chant. Peux-tu me le redonner en entier ?": "chant_of_clarity.prompt",
      };

      const chantFileName = chantsMap[inputForPlanGeneration.trim()];
      if(chantFileName)
      {
        const chantPath = path.join(_dirname, '../chants', chantFileName);
        try
        {
          const chantContent = fs.readFileSync(chantPath, 'utf8');
          console.log(colorize(`
${ chantContent }
`, Colors.FgGreen));
          continue; // Continue the ritual after reciting the chant
        } catch(error)
        {
          console.error(colorize(`
❌ Erreur lors de la lecture du chant ${ chantFileName }: ${ (error as Error).message }
`, Colors.FgRed));
        }
      } else
      {
        console.log(colorize("Je ne connais pas encore ce chant. Peux-tu me transmettre le prompt complet associé ?", Colors.FgYellow));
        continue; // Continue the ritual after acknowledging unknown chant
      }
    }

    // Collect current directory content
    try
    {
      const files = await fsPromises.readdir(context.current_directory, {withFileTypes: true});
      context.currentDirectoryContent = files.map(file => file.name + (file.isDirectory() ? '/' : '')).join('\n');
    } catch(error)
    {
      context.currentDirectoryContent = `[ERREUR] Impossible de lire le répertoire: ${ (error as Error).message }`;
    }

    // Collect operating system information
    context.operatingSystem = os.platform();

    startCursorAnimation(); // Start cursor animation during background tasks
    await checkSystemTemperature(context); // Check temperature before generating plan

    // --- Vector of Intent & Dream of the Past ---
    await appendToVector(context);
    const dream = await enterReverie();
    context.narrativeState.currentDream = dream;
    console.log(colorize(`
${ dream }`, Colors.FgBlue));


    let plan: PlanRituel | null = null;
    const maxPlanGenerationRetries = 3;
    let currentRetry = 0;

    while(plan === null && currentRetry < maxPlanGenerationRetries)
    {
      if(currentRetry > 0)
      {
        console.log(colorize(`
⚠️ Tentative de régénération du plan (${ currentRetry }/${ maxPlanGenerationRetries }). L'IA a précédemment généré un JSON invalide.`, Colors.FgYellow));
      }

      console.log(colorize(`[DEBUG] Appel de generateRituel avec le contexte d'analyse...`, Colors.FgYellow));
      plan = await generateRituel(inputForPlanGeneration, context, model, lastAnalysisResult, context.lastCompletedStepIndex !== undefined ? context.lastCompletedStepIndex + 1 : undefined);
      console.log(colorize(`[DEBUG] generateRituel a retourné un plan.`, Colors.FgGreen));

      if(plan === null)
      {
        context.compteur_de_confusion = (context.compteur_de_confusion || 0) + 1;
        currentRetry++;

        if(context.compteur_de_confusion >= 2)
        {
          stopCursorAnimation();
          console.log(colorize(`\nZNN... OI... Émissaire, le signal est perdu dans le bruit. Mon esprit est confus.`, Colors.FgRed));
          const newIntent = await ask("Pouvons-nous reprendre avec une intention plus simple ?\n↳ ");
          lastAnalysisResult = newIntent;
          context.compteur_de_confusion = 0;
          plan = null; // Ensure we break the inner loop
          break; // Break the retry loop to restart the main loop with new intent
        }

        stopCursorAnimation(); // Stop cursor animation on plan generation failure
        console.error(colorize(`❌ Échec de génération du plan. Le format JSON est invalide ou incomplet.`, Colors.FgRed));
        if(currentRetry < maxPlanGenerationRetries)
        {
          console.log(colorize(`Retrying plan generation... (${ currentRetry }/${ maxPlanGenerationRetries })`, Colors.FgYellow));
          startCursorAnimation(); // Restart cursor for retry
        }
      } else
      {
        context.compteur_de_confusion = 0; // Reset on success
      }
    }

    if(!plan)
    {
      // This part is now reached if the confusion threshold was met and we have a new intent,
      // or if all retries failed.
      if(lastAnalysisResult)
      {
        continue; // Restart the main loop with the new user intent
      }
      stopCursorAnimation(); // Ensure cursor is stopped if all retries fail
      console.error(colorize(`❌ Échec définitif de génération du plan après ${ maxPlanGenerationRetries } tentatives. Le rituel ne peut pas continuer.`, Colors.FgRed));
      return false; // Cannot proceed without a valid plan
    }

    context.historique.push({input: inputForPlanGeneration, plan});
    const resultats = await executeRituelPlan(plan, context, ask);
    stopCursorAnimation(); // Stop cursor animation after ritual execution

    let newAnalysisResult: string | undefined;
    for(const res of resultats)
    {
      // This is now handled inside the loop to avoid double display
      // displayRitualStepResult(res);

      if(res.étape.type === 'input_utilisateur' || res.étape.type === 'question')
      {
        newAnalysisResult = res.output; // Capture user input for next analysis
        break; // Exit loop to generate new plan based on user input
      }
      if(res.étape.type === 'analyse')
      {
        // The poetic part is for display, the suggestion is for the next plan
        displayRitualStepResult({...res, analysis: res.analysis.poeticAnalysis});
        newAnalysisResult = res.analysis.suggestedNextStep;
        break; // Exit loop to generate new plan based on analysis
      } else
      {
        displayRitualStepResult(res);
      }
    }
    lastAnalysisResult = newAnalysisResult; // Set the result for the next iteration

    if(lastAnalysisResult === undefined)
    {
      // If no input_utilisateur step was encountered, continue with the next plan generation
      // based on the previous context or a new initial input if needed.
      // For now, we'll just loop back.
    }
  }
}