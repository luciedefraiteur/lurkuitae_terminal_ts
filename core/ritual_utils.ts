import {handleSystemCommand} from './system_handler.js';
import {OllamaInterface} from './ollama_interface.js';
import {generateRitualSequencePrompt} from './prompts/generateRitualSequence.js'; // Corrected import
import {generateAnalysisPrompt} from './prompts/generateAnalysisPrompt.js';
import {generateErrorRemediationPrompt} from './prompts/generateErrorRemediationPrompt.js';
import {type RituelContext, type PlanRituel, CommandResult } from "./types.js"
import path from 'path';
import fs from 'fs';

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
    }

    resultats.push(result);
  }

  return resultats;
}