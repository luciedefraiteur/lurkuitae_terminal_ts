import {executeRituelPlan, generateRituel} from './ritual_utils.js';
import {RituelContext, PlanRituel, Étape} from './types.js';
import {Colors, colorize} from './utils/ui_utils.js';
import * as stepHandlers from './ritual_step_handlers.js';

async function testReplanLogic()
{
    console.log(colorize("--- Running Test: Re-planning Logic without Infinite Loop ---", Colors.FgYellow));

    // --- Test Setup ---
    let analysisCounter = 0;

    const mockHandleAnalyse = async (étape: Étape, context: RituelContext, index: number, plan: PlanRituel) =>
    {
        analysisCounter++;
        console.log(colorize(`[MOCK] handleAnalyse called. Count: ${ analysisCounter }`, Colors.FgMagenta));
        return {
            étape,
            index,
            analysis: "Analysis result that should trigger a new plan."
        };
    };

    const mockHandleCommande = async (étape: Étape, context: RituelContext, plan: PlanRituel) =>
    {
        console.log(colorize(`[MOCK] handleCommande called for: ${ étape.contenu }`, Colors.FgMagenta));
        return {
            étape,
            index: -1, // This will be set by the loop
            output: "Mocked command output",
            success: true,
        };
    };

    const mockGenerateRituel = async (input: string, context: RituelContext, model?: any, analysisResult?: string): Promise<PlanRituel | null> =>
    {
        const newPlanAfterAnalysis: PlanRituel = {
            étapes: [
                {type: 'dialogue', contenu: 'Okay, I have analyzed the files.'},
                {type: 'commande', contenu: 'cat the_biggest_file.txt'}
            ],
            complexité: 'simple',
            index: 0
        };
        return newPlanAfterAnalysis;
    };


    const initialPlan: PlanRituel = {
        étapes: [
            {type: 'commande', contenu: 'ls -l'},
            {type: 'analyse', contenu: 'Find the biggest file'},
            {type: 'commande', contenu: 'This should be replaced'}
        ],
        complexité: 'simple',
        index: 0
    };

    const context: RituelContext = {
        historique: [{input: "test input", plan: initialPlan}],
        command_input_history: [],
        command_output_history: [],
        step_results_history: [],
        current_directory: '/test',
        temperatureStatus: 'normal',
        lucieDefraiteur: {} as any,
        chantModeEnabled: false,
        narrativeState: {
            currentArc: "The Awakening",
            keyMotifs: ["fractals", "memory", "breath"],
            characterStates: {
                lucie: {
                    state: "dormant",
                    awakeness: 0.1
                }
            }
        },
        emotionalState: {
            agapePhobos: 0,
            logosPathos: 0,
            harmoniaEris: 0,
        }
    };

    const ask = async (q: string) => "oui";

    const mockStepHandlers = {
        ...stepHandlers,
        handleAnalyse: mockHandleAnalyse,
        handleCommande: mockHandleCommande,
    };

    // --- Execution ---
    console.log(colorize("[TEST] Executing ritual plan...", Colors.FgCyan));
    const planToExecute = JSON.parse(JSON.stringify(initialPlan));
    await executeRituelPlan(planToExecute, context, ask, {
        generateRituel: mockGenerateRituel,
        stepHandlers: mockStepHandlers as any,
    });

    // --- Assertions ---
    console.log(colorize("[TEST] Verifying assertions...", Colors.FgCyan));

    const executedStepTypes = planToExecute.étapes.map((e: Étape) => e.type);
    console.log(`Executed step types: ${ executedStepTypes.join(', ') }`);

    // 1. The 'analyse' step should only be called once.
    if(analysisCounter !== 1)
    {
        console.error(colorize(`[FAIL] Analysis was triggered ${ analysisCounter } times, expected 1.`, Colors.FgRed));
    } else
    {
        console.log(colorize("[PASS] Analysis was triggered exactly once.", Colors.FgGreen));
    }

    // 2. The final plan should contain the new steps.
    const expectedFinalSteps = ['commande', 'analyse', 'dialogue', 'commande'];
    if(JSON.stringify(executedStepTypes) !== JSON.stringify(expectedFinalSteps))
    {
        console.error(colorize(`[FAIL] Final plan steps are incorrect. Expected ${ expectedFinalSteps.join(', ') } but got ${ executedStepTypes.join(', ') }`, Colors.FgRed));
    } else
    {
        console.log(colorize("[PASS] Final plan contains the correctly spliced steps.", Colors.FgGreen));
    }

    // 3. The step after the original 'analyse' should be the first step of the new plan.
    const stepAfterAnalysis = planToExecute.étapes[2];
    if(stepAfterAnalysis.type !== 'dialogue')
    {
        console.error(colorize(`[FAIL] Step after analysis is incorrect. Expected 'dialogue', got '${ stepAfterAnalysis.type }'`, Colors.FgRed));
    } else
    {
        console.log(colorize("[PASS] The step after analysis was correctly replaced.", Colors.FgGreen));
    }
}

const testTimeout = 60000; // 60 seconds

Promise.race([
    testReplanLogic(),
    new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Test timed out after ${ testTimeout }ms`)), testTimeout)
    )
]).catch(err =>
{
    console.error(colorize(`[FATAL TEST ERROR] ${ err }`, Colors.FgRed));
    process.exit(1);
});