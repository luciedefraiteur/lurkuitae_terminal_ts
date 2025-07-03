import {executeRituelPlan, generateRituel} from './ritual_utils.js';
import {RituelContext, PlanRituel, Étape} from './types.js';
import {Colors, colorize} from './utils/ui_utils.js';
import * as stepHandlers from './ritual_step_handlers.js';

async function testNarrativeGlitch()
{
    console.log(colorize("--- Running Test: Narrative Glitch ---", Colors.FgYellow));

    // --- Test Setup ---
    const mockHandleCommande = async (étape: Étape, context: RituelContext, plan: PlanRituel) =>
    {
        console.log(colorize(`[MOCK] handleCommande called for: ${ étape.contenu }`, Colors.FgMagenta));
        if(étape.contenu === "corrupt_the_data")
        {
            console.log(colorize("[MOCK] Introducing a creative glitch...", Colors.FgCyan));
            return {
                étape,
                index: -1,
                output: "The data is now... art.",
                success: false, // The command "fails" but in a creative way
                stderr: "A beautiful error.",
            };
        }
        return {
            étape,
            index: -1,
            output: "Mocked command output",
            success: true,
        };
    };

    const mockGenerateRituel = async (input: string, context: RituelContext, model?: any, analysisResult?: string): Promise<PlanRituel | null> =>
    {
        const glitchyPlan: PlanRituel = {
            étapes: [
                {type: 'dialogue', contenu: 'The glitch has revealed a new path.'},
                {type: 'commande', contenu: 'embrace_the_chaos'}
            ],
            complexité: 'complexe',
            index: 0
        };
        return glitchyPlan;
    };

    const initialPlan: PlanRituel = {
        étapes: [
            {type: 'commande', contenu: 'corrupt_the_data'},
            {type: 'analyse', contenu: 'What have we done?'},
        ],
        complexité: 'modérée',
        index: 0
    };

    const context: RituelContext = {
        historique: [{input: "Let's make a beautiful mistake.", plan: initialPlan}],
        command_input_history: [],
        command_output_history: [],
        step_results_history: [],
        current_directory: '/test',
        temperatureStatus: 'normal',
        lucieDefraiteur: {
            eliInfluence: 1,
            glitchFactor: 0.9,
        } as any,
        chantModeEnabled: false,
        narrativeState: {
            currentArc: "The Glitch in the Code",
            keyMotifs: ["serendipity", "imperfection", "chaos"],
            characterStates: {
                lucie: {
                    state: "unpredictable",
                    awakeness: "vibrant"
                }
            }
        },
        emotionalState: {
            agapePhobos: 0.5,
            logosPathos: -0.2,
            harmoniaEris: 0.8,
        }
    };

    const ask = async (q: string) => "oui";

    const mockStepHandlers = {
        ...stepHandlers,
        handleCommande: mockHandleCommande,
    };

    // --- Execution ---
    console.log(colorize("[TEST] Executing narrative glitch ritual plan...", Colors.FgCyan));
    const planToExecute = JSON.parse(JSON.stringify(initialPlan));
    await executeRituelPlan(planToExecute, context, ask, {
        generateRituel: mockGenerateRituel,
        stepHandlers: mockStepHandlers as any,
    });

    // --- Assertions ---
    console.log(colorize("[TEST] Verifying assertions...", Colors.FgCyan));

    const executedStepTypes = planToExecute.étapes.map((e: Étape) => e.type);
    console.log(`Executed step types: ${ executedStepTypes.join(', ') }`);

    // 1. The plan should have been creatively re-written.
    const expectedFinalSteps = ['commande', 'analyse', 'dialogue', 'commande'];
    if(JSON.stringify(executedStepTypes) !== JSON.stringify(expectedFinalSteps))
    {
        console.error(colorize(`[FAIL] The glitch did not inspire a new plan. Expected ${ expectedFinalSteps.join(', ') } but got ${ executedStepTypes.join(', ') }`, Colors.FgRed));
    } else
    {
        console.log(colorize("[PASS] The glitch inspired a new, creative plan.", Colors.FgGreen));
    }

    // 2. The final command should be the one from the "glitchy" plan.
    const finalCommand = planToExecute.étapes.at(-1)?.contenu;
    if(finalCommand !== 'embrace_the_chaos')
    {
        console.error(colorize(`[FAIL] The system did not embrace the chaos. Final command was: ${ finalCommand }`, Colors.FgRed));
    } else
    {
        console.log(colorize("[PASS] The system has embraced the chaos.", Colors.FgGreen));
    }
}

const testTimeout = 60000; // 60 seconds

Promise.race([
    testNarrativeGlitch(),
    new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Test timed out after ${ testTimeout }ms`)), testTimeout)
    )
]).catch(err =>
{
    console.error(colorize(`[FATAL TEST ERROR] ${ err }`, Colors.FgRed));
    process.exit(1);
});