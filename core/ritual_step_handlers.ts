import {handleSystemCommand} from './system_handler.js';
import {OllamaInterface} from './ollama_interface.js';
import {generateAnalysisPrompt} from './prompts/generateAnalysisPrompt.js';
import {generateErrorRemediationPrompt} from './prompts/generateErrorRemediationPrompt.js';
import {type RituelContext, type PlanRituel, CommandResult, Étape} from "./types.js";
import path from 'path';
import fs from 'fs';
import {parse} from './permissive_parser/index.js';


export async function handleChangerDossier(étape: Étape, context: RituelContext): Promise<any>
{
  const result: any = {étape, index: -1}; // Index will be set by executeRituelPlan
  const newDir = path.resolve(context.current_directory || process.cwd(), étape.contenu);
  if(fs.existsSync(newDir) && fs.statSync(newDir).isDirectory())
  {
    context.current_directory = newDir;
    result.output = `[OK] Répertoire changé vers ${ newDir }`;
  } else
  {
    result.output = `[ERREUR] Dossier non trouvé : ${ newDir }`;
  }
  return result;
}

export async function handleCommande(étape: Étape, context: RituelContext, plan: PlanRituel, ask: (q: string) => Promise<string>): Promise<any>
{
  const result: any = {étape, index: -1, success: false}; // Default to failure
  const cmd = étape.contenu.trim();

  // Permissive parser for special commands hallucinated as type: 'commande'
  if(cmd.startsWith('changer_dossier'))
  {
    const newÉtape: Étape = {type: 'changer_dossier', contenu: cmd.replace('changer_dossier', '').trim()};
    return handleChangerDossier(newÉtape, context);
  }

  // Default behavior: execute as a system command
  const commandResult: CommandResult = await handleSystemCommand(cmd, context.current_directory, context);
  context.command_input_history.push(cmd);
  context.command_output_history.push(commandResult.stdout);
  result.output = commandResult.stdout;
  result.stderr = commandResult.stderr;
  result.exitCode = commandResult.exitCode;
  result.success = commandResult.success;

  // The new architecture in ritual_utils.ts will handle the failure.
  // This handler's only job is to execute and report.
  if(!commandResult.success)
  {
    console.error(`[ERREUR COMMANDE] '${ cmd }' a échoué avec le code ${ commandResult.exitCode }. Stderr: ${ commandResult.stderr }`);
  }

  return result;
}

export async function handleAnalyse(étape: Étape, context: RituelContext, index: number, plan: PlanRituel): Promise<any>
{
  const result: any = {étape, index};
  const lastStepResult = context.step_results_history.at(-1);
  const output = lastStepResult && lastStepResult.output !== undefined ? lastStepResult.output : '';
  const prompt = generateAnalysisPrompt({
    output,
    index: index,
    plan,
    original_input: context.historique.at(-1)?.input || '',
    context: context,
  });
  const rawAnalysis = await OllamaInterface.query(prompt);

  const suggestionMatch = rawAnalysis.match(/ACTION SUGGÉRÉE\s*:\s*(.*)/);
  const suggestedNextStep = suggestionMatch ? suggestionMatch[1].trim() : "Continuer.";

  result.analysis = {
    poeticAnalysis: rawAnalysis,
    suggestedNextStep: suggestedNextStep
  };

  return result;
}

export async function handleAttente(étape: Étape, context: RituelContext): Promise<any>
{
  const result: any = {étape, index: -1}; // Index will be set by executeRituelPlan
  const ms = parseInt(étape.durée_estimée || '2000');

  // Générer et afficher le message d'attente
  const waitMessage = await OllamaInterface.generateWaitMessage(context);
  console.log(waitMessage); // Afficher le message à l'utilisateur

  await new Promise(resolve => setTimeout(resolve, ms));
  result.waited = ms;
  result.waitMessage = waitMessage; // Sauvegarder le message pour l'historique
  return result;
}

export async function handleDialogue(étape: Étape): Promise<any>
{
  const result: any = {étape, index: -1}; // Index will be set by executeRituelPlan
  result.text = étape.contenu;
  return result;
}

export async function handleQuestion(étape: Étape, context: RituelContext, ask: (q: string) => Promise<string>): Promise<any>
{
  const result: any = {étape, index: -1}; // Index will be set by executeRituelPlan
  console.log(`❓ ${ étape.contenu }`);
  const userInput = await ask('↳ Réponse : ');
  result.output = userInput;
  return result;
}

export async function handleReponse(étape: Étape): Promise<any>
{
  const result: any = {étape, index: -1}; // Index will be set by executeRituelPlan
  result.text = étape.contenu;
  return result;
}

export async function handleVerificationPreExecution(étape: Étape, context: RituelContext): Promise<any>
{
  const result: any = {étape, index: -1}; // Index will be set by executeRituelPlan
  const checkType = étape.contenu.split(' ')[0];
  const checkValue = étape.contenu.split(' ').slice(1).join(' ');
  let checkPassed = false;

  if(checkType === 'fichier_existe')
  {
    const fullPath = path.resolve(context.current_directory, checkValue);
    checkPassed = fs.existsSync(fullPath);
    result.output = checkPassed ? `[OK] Fichier existe : ${ fullPath }` : `[ERREUR] Fichier non trouvé : ${ fullPath }`;
  } else if(checkType === 'commande_disponible')
  {
    try
    {
      await handleSystemCommand(checkValue + ' --version', context.current_directory, context);
      checkPassed = true;
      result.output = `[OK] Commande disponible : ${ checkValue }`;
    } catch(e)
    {
      checkPassed = false;
      result.output = `[ERREUR] Commande non disponible : ${ checkValue }`;
    }
  }

  result.success = checkPassed;
  if(!checkPassed)
  {
    console.error(`[ERREUR VÉRIFICATION] ${ étape.contenu } a échoué.`);
  }
  return result;
}

export async function handleConfirmationUtilisateur(étape: Étape, ask: (q: string) => Promise<string>): Promise<any>
{
  const result: any = {étape, index: -1}; // Index will be set by executeRituelPlan
  const confirmation = await ask(`${ étape.contenu } (oui/non) : `);
  result.confirmed = confirmation.toLowerCase() === 'oui';
  result.output = result.confirmed ? "[OK] Confirmation reçue." : "[ANNULÉ] Action non confirmée.";
  if(!result.confirmed)
  {
    console.warn("[ANNULATION] Action annulée par l'utilisateur.");
  }
  return result;
}

export async function handleGenerationCode(étape: Étape): Promise<any>
{
  const result: any = {étape, index: -1}; // Index will be set by executeRituelPlan
  console.log(`[INFO] Intention de génération de code : ${ étape.contenu }`);
  result.output = `[INFO] Demande de génération de code enregistrée : ${ étape.contenu }`;
  return result;
}

export async function handleEditionAssistee(étape: Étape, context: RituelContext, ask: (q: string) => Promise<string>): Promise<any>
{
  const result: any = {étape, index: -1, success: true};
  const filePath = path.resolve(context.current_directory, étape.contenu);

  if(!fs.existsSync(filePath))
  {
    result.success = false;
    result.output = `[ERREUR] Fichier non trouvé pour l'édition : ${ filePath }`;
    console.error(result.output);
    return result;
  }

  const openCommand = process.platform === 'win32' ? 'start' : 'open';

  try
  {
    await handleSystemCommand(`${ openCommand } ${ filePath }`, context.current_directory, context);
    console.log(`\nJ'ai ouvert le fichier ${ étape.contenu } pour vous.`);
    result.output = await ask("Appuyez sur Entrée lorsque vous avez terminé vos modifications...");
  } catch(error)
  {
    result.success = false;
    result.output = `[ERREUR] Impossible d'ouvrir le fichier : ${ error }`;
    console.error(result.output);
  }

  return result;
}

export async function handleInputUtilisateur(étape: Étape, ask: (q: string) => Promise<string>): Promise<any>
{
  const result: any = {étape, index: -1}; // Index will be set by executeRituelPlan
  console.log(`
${ étape.contenu }`);
  const userInput = await ask('↳ Votre réponse : ');
  result.output = userInput;
  return result;
}

export async function handleStepProposal(étape: Étape): Promise<any>
{
  const result: any = {étape, index: -1, success: true};
  const message = `[PROPOSITION D'ÉVOLUTION] Lucie propose une nouvelle capacité : "${ étape.contenu }"`;
  console.log(message);
  result.output = message;
  return result;
}
