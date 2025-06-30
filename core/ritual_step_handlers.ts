import { handleSystemCommand } from './system_handler.js';
import { OllamaInterface } from './ollama_interface.js';
import { generateAnalysisPrompt } from './prompts/generateAnalysisPrompt.js';
import { generateErrorRemediationPrompt } from './prompts/generateErrorRemediationPrompt.js';
import { type RituelContext, type PlanRituel, CommandResult, Étape } from "./types.js";
import path from 'path';
import fs from 'fs';

export async function handleChangerDossier(étape: Étape, context: RituelContext): Promise<any> {
  const result: any = { étape, index: -1 }; // Index will be set by executeRituelPlan
  const newDir = path.resolve(context.current_directory || process.cwd(), étape.contenu);
  if (fs.existsSync(newDir) && fs.statSync(newDir).isDirectory()) {
    context.current_directory = newDir;
    result.output = `[OK] Répertoire changé vers ${newDir}`;
  } else {
    result.output = `[ERREUR] Dossier non trouvé : ${newDir}`;
  }
  return result;
}

export async function handleCommande(étape: Étape, context: RituelContext, plan: PlanRituel): Promise<any> {
  const result: any = { étape, index: -1 }; // Index will be set by executeRituelPlan
  const cmd = étape.contenu.startsWith('$') ? étape.contenu.slice(1) : étape.contenu;
  const commandResult: CommandResult = await handleSystemCommand(cmd, context.current_directory);
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

    const remediationPlan = await OllamaInterface.query(remediationPrompt);
    try {
      const parsedRemediationPlan: PlanRituel = JSON.parse(remediationPlan.trim());
      console.log("[INFO] Exécution du sous-rituel de remédiation...");
      // Assuming executeRituelPlan is available here or passed as argument
      // For now, we'll just log that it would be executed.
      // const remediationResults = await executeRituelPlan(parsedRemediationPlan, context);
      // result.remediationResults = remediationResults;
      result.remediationResults = "Remediation plan generated and would be executed.";
    } catch (e: unknown) {
      let errorMessage = "An unknown error occurred during remediation plan parsing.";
      if (e instanceof Error) {
        errorMessage = e.message;
      }
      console.error("[ERREUR] Échec du parsing du plan de remédiation :", errorMessage);
      result.remediationError = errorMessage;
    }
  }
  return result;
}

export async function handleAnalyse(étape: Étape, context: RituelContext, index: number, plan: PlanRituel): Promise<any> {
  const result: any = { étape, index };
  const output = context.command_output_history.at(-1) || '';
  const prompt = generateAnalysisPrompt({
    output,
    index: index,
    plan,
    original_input: context.historique.at(-1)?.input || '',
  });
  const analysis = await OllamaInterface.query(prompt);
  result.analysis = analysis;
  return result;
}

export async function handleAttente(étape: Étape): Promise<any> {
  const result: any = { étape, index: -1 }; // Index will be set by executeRituelPlan
  const ms = parseInt(étape.durée_estimée || '2000');
  await new Promise(resolve => setTimeout(resolve, ms));
  result.waited = ms;
  return result;
}

export async function handleDialogue(étape: Étape): Promise<any> {
  const result: any = { étape, index: -1 }; // Index will be set by executeRituelPlan
  result.text = étape.contenu;
  return result;
}

export async function handleQuestion(étape: Étape, context: RituelContext, ask: (q: string) => Promise<string>): Promise<any> {
  const result: any = { étape, index: -1 }; // Index will be set by executeRituelPlan
  result.text = étape.contenu;
  console.log(`❓ ${ étape.contenu }`);
  const userInput = await ask('↳ Réponse : ');
  // This part needs to be handled by runTerminalRituel or a higher level function
  // as it involves generating a new ritual plan.
  result.userInput = userInput;
  return result;
}

export async function handleReponse(étape: Étape): Promise<any> {
  const result: any = { étape, index: -1 }; // Index will be set by executeRituelPlan
  result.text = étape.contenu;
  return result;
}

export async function handleVerificationPreExecution(étape: Étape, context: RituelContext): Promise<any> {
  const result: any = { étape, index: -1 }; // Index will be set by executeRituelPlan
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
  }
  return result;
}

export async function handleConfirmationUtilisateur(étape: Étape, ask: (q: string) => Promise<string>): Promise<any> {
  const result: any = { étape, index: -1 }; // Index will be set by executeRituelPlan
  const confirmation = await ask(`${étape.contenu} (oui/non) : `);
  result.confirmed = confirmation.toLowerCase() === 'oui';
  result.output = result.confirmed ? "[OK] Confirmation reçue." : "[ANNULÉ] Action non confirmée.";
  if (!result.confirmed) {
    console.warn("[ANNULATION] Action annulée par l'utilisateur.");
  }
  return result;
}

export async function handleGenerationCode(étape: Étape): Promise<any> {
  const result: any = { étape, index: -1 }; // Index will be set by executeRituelPlan
  console.log(`[INFO] Intention de génération de code : ${étape.contenu}`);
  result.output = `[INFO] Demande de génération de code enregistrée : ${étape.contenu}`;
  return result;
}
