import {handleSystemCommand} from './system_handler.js';
import {OllamaInterface} from './ollama_interface.js';
import {generateRitualSequencePrompt} from './prompts/generateRitualSequence.js'; // Corrected import
import {generateAnalysisPrompt} from './prompts/generateAnalysisPrompt.js';
import {generateErrorRemediationPrompt} from './prompts/generateErrorRemediationPrompt.js';
import {type RituelContext, type PlanRituel, CommandResult } from "./types.js"
import path from 'path';
import fs from 'fs';
import readline from 'readline';

const rl = readline.createInterface({input: process.stdin, output: process.stdout});
const ask = (q: string) => new Promise<string>((res) => rl.question(q, res));

export function getContexteInitial(): RituelContext {
  return {
    historique: [],
    command_input_history: [],
    command_output_history: [],
    current_directory: process.cwd()
  };
}

export async function safeQuery(prompt: string, label: string): Promise<string> {
  let response = '';
  let attempts = 0;

  while (!response && attempts < 3) {
    response = await OllamaInterface.query(prompt);
    await new Promise((r) => setTimeout(r, 1));
    attempts++;
    console.log(`[INFO] Tentative ${attempts} - ${label} : ${response}`);
  }

  if (!response) {
    console.log(`[INFO] Échec de génération pour : ${label}`);
    response = `Échec pour : ${label}`;
  }

  return response;
}

export async function generateRituel(input: string, context: RituelContext): Promise<PlanRituel | null> {
  const planPrecedent = context.historique.at(-1)?.plan;
  const indexPrecedent = planPrecedent?.index ?? undefined;
  const prompt = generateRitualSequencePrompt(input, planPrecedent, indexPrecedent);
  const response = await safeQuery(prompt, 'planification');

  try {
    return JSON.parse(response.trim());
  } catch {
    return null;
  }
}

export async function executeRituelPlan(plan: PlanRituel, context: RituelContext): Promise<any[]> { // Corrected function name
  const resultats: any[] = [];

  for (let i = 0; i < plan.étapes.length; i++) {
    const étape = plan.étapes[i];
    const result: any = { étape, index: i };

    switch (étape.type) {

      case 'changer_dossier': {
        const newDir = path.resolve(context.current_directory || process.cwd(), étape.contenu);
        if (fs.existsSync(newDir) && fs.statSync(newDir).isDirectory()) {
          context.current_directory = newDir;
          result.output = `[OK] Répertoire changé vers ${newDir}`;
        } else {
          result.output = `[ERREUR] Dossier non trouvé : ${newDir}`;
        }
        break;
      }
      case 'commande': {
        const cmd = étape.contenu.startsWith('$') ? étape.contenu.slice(1) : étape.contenu;
        const commandResult: CommandResult = await handleSystemCommand(cmd, context.current_directory); // Explicitly type commandResult
        context.command_input_history.push(cmd);
        context.command_output_history.push(commandResult.stdout);
        result.output = commandResult.stdout;
        result.stderr = commandResult.stderr;
        result.exitCode = commandResult.exitCode;
        result.success = commandResult.success;

        if (!commandResult.success) {
          console.error(`[ERREUR COMMANDE] ${cmd} a échoué avec le code ${commandResult.exitCode}.`);
          if (commandResult.stderr) {
            console.error(`Stderr: ${commandResult.stderr}`);
          }

          const remediationPrompt = generateErrorRemediationPrompt({
            command: cmd,
            commandResult: commandResult,
            contextHistory: context.historique,
            originalInput: context.historique.at(-1)?.input || '',
            currentPlan: plan
          });

          const remediationPlan = await safeQuery(remediationPrompt, 'remédiation');
          try {
            const parsedRemediationPlan: PlanRituel = JSON.parse(remediationPlan.trim());
            console.log("[INFO] Exécution du sous-rituel de remédiation...");
            const remediationResults = await executeRituelPlan(parsedRemediationPlan, context);
            result.remediationResults = remediationResults;
          } catch (e: unknown) {
            let errorMessage = "An unknown error occurred during remediation plan parsing.";
            if (e instanceof Error) {
              errorMessage = e.message;
            }
            console.error("[ERREUR] Échec du parsing du plan de remédiation :", errorMessage);
            result.remediationError = errorMessage;
          }
        }
        break;
      }

      case 'analyse': {
        const output = context.command_output_history.at(-1) || '';
        const prompt = generateAnalysisPrompt({
          output,
          index: i,
          plan,
          original_input: context.historique.at(-1)?.input || '',
        });
        const analysis = await safeQuery(prompt, 'analyse');
        result.analysis = analysis;
        break;
      }

      case 'attente': {
        const ms = parseInt(étape.durée_estimée || '2000');
        await new Promise(resolve => setTimeout(resolve, ms));
        result.waited = ms;
        break;
      }

      case 'dialogue':
      case 'question':
      case 'réponse': {
        result.text = étape.contenu;
        break;
      }

      case 'vérification_pré_exécution': {
        const checkType = étape.contenu.split(' ')[0];
        const checkValue = étape.contenu.split(' ').slice(1).join(' ');
        let checkPassed = false;

        if (checkType === 'fichier_existe') {
          const fullPath = path.resolve(context.current_directory, checkValue);
          checkPassed = fs.existsSync(fullPath);
          result.output = checkPassed ? `[OK] Fichier existe : ${fullPath}` : `[ERREUR] Fichier non trouvé : ${fullPath}`;
        } else if (checkType === 'commande_disponible') {
          try {
            await handleSystemCommand(checkValue + ' --version', context.current_directory);
            checkPassed = true;
            result.output = `[OK] Commande disponible : ${checkValue}`;
          } catch (e) {
            checkPassed = false;
            result.output = `[ERREUR] Commande non disponible : ${checkValue}`;
          }
        }

        result.success = checkPassed;
        if (!checkPassed) {
          console.error(`[ERREUR VÉRIFICATION] ${étape.contenu} a échoué.`);
          // Optionally trigger remediation here as well
        }
        break;
      }

      case 'confirmation_utilisateur': {
        const confirmation = await ask(`${étape.contenu} (oui/non) : `);
        result.confirmed = confirmation.toLowerCase() === 'oui';
        result.output = result.confirmed ? "[OK] Confirmation reçue." : "[ANNULÉ] Action non confirmée.";
        if (!result.confirmed) {
          console.warn("[ANNULATION] Action annulée par l'utilisateur.");
          // Potentially break the ritual execution or trigger remediation
        }
        break;
      }

      case 'génération_code': {
        console.log(`[INFO] Intention de génération de code : ${étape.contenu}`);
        result.output = `[INFO] Demande de génération de code enregistrée : ${étape.contenu}`;
        // In a real scenario, this would trigger a code generation module
        break;
      }
    }

    resultats.push(result);
  }

  return resultats;
}