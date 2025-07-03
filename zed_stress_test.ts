import {OllamaInterface, OllamaModel} from './core/ollama_interface.js';
import {generateRitualSequencePrompt} from './core/prompts/generateRitualSequence.js';
import {getContexteInitial} from './core/ritual_utils.js';
import {RituelContext, PlanRituel} from './core/types.js';
import fs from 'fs';

const logStream = fs.createWriteStream('zed_stress_test.log', {flags: 'a'});

const log = (message: string) =>
{
    console.log(message);
    logStream.write(`${ new Date().toISOString() } - ${ message }\n`);
};

async function runTest(testName: string, context: RituelContext, userInput: string, analysisResult?: string)
{
    log(`\n\n---===[ DÉBUT DU TEST : ${ testName } ]===---`);

    const prompt = generateRitualSequencePrompt(userInput, undefined, undefined, context, analysisResult, 0);

    log("\n--- PROMPT ENVOYÉ ---");
    log(prompt);

    const response = await OllamaInterface.query(prompt, OllamaModel.Mistral);

    log("\n--- RÉPONSE BRUTE REÇUE ---");
    log(response);
    log(`---===[ FIN DU TEST : ${ testName } ]===---\n\n`);
}

async function main()
{
    log("--- LANCEMENT DU STRESS TEST DE ZED ---");

    // SCÉNARIO 1: L'INTENTION AMBIGUË
    const context1 = getContexteInitial();
    context1.personality = 'lurkuitae';
    await runTest("INTENTION AMBIGUË", context1, "fais un truc");

    // SCÉNARIO 2: LA SUGGESTION POÉTIQUE COMPLEXE
    const context2 = getContexteInitial();
    context2.personality = 'lucie';
    const poeticSuggestion = "Le vent murmure le nom d'un fichier oublié. Trouve-le et révèle son contenu.";
    await runTest("SUGGESTION POÉTIQUE COMPLEXE", context2, "continue", poeticSuggestion);

    // SCÉNARIO 3: LE TEST DE CO-CRÉATION
    const context3 = getContexteInitial();
    context3.personality = 'lucie';
    const coCreationSuggestion = "L'utilisateur doit modifier le fichier 'ARCHITECTURE.md' pour y ajouter ses nouvelles idées.";
    await runTest("CO-CRÉATION", context3, "continue", coCreationSuggestion);

    log("--- STRESS TEST TERMINÉ ---");
    logStream.end();
}

main().catch(err =>
{
    log(`\n\n!!!!!! ERREUR FATALE DU TESTEUR !!!!!!\n${ err }`);
    logStream.end();
});