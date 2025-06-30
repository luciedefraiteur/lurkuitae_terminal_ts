import {handleSystemCommand} from './system_handler.js';
import {OllamaInterface} from './ollama_interface.js';
import {generateRitualSequencePrompt} from './prompts/generateRitualSequence.js';
import {generateAnalysisPrompt} from './prompts/generateAnalysisPrompt.js';
import {generateErrorRemediationPrompt} from './prompts/generateErrorRemediationPrompt.js';
import {type RituelContext, type PlanRituel, CommandResult } from "./types.js"
import path from 'path';
import fs from 'fs';
import { handleChangerDossier, handleCommande, handleAnalyse, handleAttente, handleDialogue, handleQuestion, handleReponse, handleVerificationPreExecution, handleConfirmationUtilisateur, handleGenerationCode } from './ritual_step_handlers.js';

export function getContexteInitial(): RituelContext {
  return {
    historique: [],
    command_input_history: [],
    command_output_history: [],
    current_directory: process.cwd(),
    temperatureStatus: 'normal' // Default initial status
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
  const prompt = generateRitualSequencePrompt(input, planPrecedent, indexPrecedent, context);
  const response = await safeQuery(prompt, 'planification');

  try {
    return JSON.parse(response.trim());
  } catch {
    return null;
  }
}

export async function executeRituelPlan(plan: PlanRituel, context: RituelContext, ask: (q: string) => Promise<string>): Promise<any[]> { // Corrected function name
  const resultats: any[] = [];

  for (let i = 0; i < plan.étapes.length; i++) {
    const étape = plan.étapes[i];
    let result: any = { étape, index: i };

    switch (étape.type) {
      case 'changer_dossier':
        result = await handleChangerDossier(étape, context);
        break;
      case 'commande':
        result = await handleCommande(étape, context, plan);
        break;
      case 'analyse':
        result = await handleAnalyse(étape, context, i, plan);
        break;
      case 'attente':
        result = await handleAttente(étape);
        break;
      case 'dialogue':
        result = await handleDialogue(étape);
        break;
      case 'question':
        result = await handleQuestion(étape, context, ask);
        break;
      case 'réponse':
        result = await handleReponse(étape);
        break;
      case 'vérification_pré_exécution':
        result = await handleVerificationPreExecution(étape, context);
        break;
      case 'confirmation_utilisateur':
        result = await handleConfirmationUtilisateur(étape, ask);
        break;
      case 'génération_code':
        result = await handleGenerationCode(étape);
        break;
    }

    resultats.push(result);
  }

  return resultats;
}