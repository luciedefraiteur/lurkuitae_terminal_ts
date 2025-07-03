import {calculateEmotion, interpretEmotion, journeyTowards} from './emotional_core.js';
import {RituelContext, KardiosSphairaState} from './types.js';
import {OllamaInterface} from './ollama_interface.js';

// Simple mock for jest
const jest = {
    fn: <T extends (...args: any[]) => any>() =>
    {
        const mockFn = (...args: Parameters<T>): ReturnType<T> =>
        {
            mockFn.mock.calls.push(args);
            if(mockFn.mock.implementation)
            {
                return mockFn.mock.implementation(...args);
            }
            // A bit of a hack for our simple mock, but it ensures type safety.
            return Promise.resolve('') as ReturnType<T>;
        };
        mockFn.mock = {
            calls: [] as Parameters<T>[],
            implementation: null as ((...args: Parameters<T>) => ReturnType<T>) | null,
        };
        mockFn.mockImplementation = (impl: (...args: Parameters<T>) => ReturnType<T>) =>
        {
            mockFn.mock.implementation = impl;
            return mockFn;
        };
        return mockFn;
    }
};

async function runTest(name: string, testFn: () => Promise<void>)
{
    console.log(`--- Running Test: ${ name } ---`);
    try
    {
        await testFn();
        console.log(`[PASS] ${ name }`);
    } catch(error)
    {
        console.error(`[FAIL] ${ name }`, error);
    }
}

runTest("Calculate Emotion produces valid state", async () =>
{
    const context: RituelContext = {
        historique: [],
        command_input_history: [],
        command_output_history: [],
        step_results_history: [],
        current_directory: '/test',
        temperatureStatus: 'normal',
        lucieDefraiteur: {
            almaInfluence: 0.5,
            eliInfluence: 0.5,
            glitchFactor: 0.1,
        } as any,
        chantModeEnabled: false,
        narrativeState: {} as any,
        emotionalState: {} as any,
    };

    const emotionalState = calculateEmotion(context);

    if(emotionalState.agapePhobos < -1 || emotionalState.agapePhobos > 1)
    {
        throw new Error(`agapePhobos is out of bounds: ${ emotionalState.agapePhobos }`);
    }
    if(emotionalState.logosPathos < -1 || emotionalState.logosPathos > 1)
    {
        throw new Error(`logosPathos is out of bounds: ${ emotionalState.logosPathos }`);
    }
    if(emotionalState.harmoniaEris < -1 || emotionalState.harmoniaEris > 1)
    {
        throw new Error(`harmoniaEris is out of bounds: ${ emotionalState.harmoniaEris }`);
    }
});

runTest("Journey Towards moves state correctly", async () =>
{
    const currentState: KardiosSphairaState = {
        agapePhobos: 0,
        logosPathos: 0,
        harmoniaEris: 0,
    };

    const targetState: KardiosSphairaState = {
        agapePhobos: 1,
        logosPathos: -1,
        harmoniaEris: 0.5,
    };

    const nextState = journeyTowards(currentState, targetState);

    if(nextState.agapePhobos !== 0.1)
    {
        throw new Error(`Expected agapePhobos to be 0.1, but got ${ nextState.agapePhobos }`);
    }
    if(nextState.logosPathos !== -0.1)
    {
        throw new Error(`Expected logosPathos to be -0.1, but got ${ nextState.logosPathos }`);
    }
    if(nextState.harmoniaEris !== 0.05)
    {
        throw new Error(`Expected harmoniaEris to be 0.05, but got ${ nextState.harmoniaEris }`);
    }
});

runTest("Interpret Emotion calls LLM with correct prompt", async () =>
{
    const mockQuery = jest.fn<typeof OllamaInterface.query>();
    OllamaInterface.query = mockQuery;

    const emotionalState: KardiosSphairaState = {
        agapePhobos: 0.5,
        logosPathos: -0.2,
        harmoniaEris: 0.8,
    };

    await interpretEmotion(emotionalState);

    const expectedPrompt = `The current emotional state is defined by three axes:
- Agape/Phobos (Love/Fear): 0.500
- Logos/Pathos (Reason/Passion): -0.200
- Harmonia/Eris (Harmony/Discord): 0.800

Translate these coordinates into a short, poetic, and evocative description of this emotional state.`;

    if(mockQuery.mock.calls.length !== 1)
    {
        throw new Error("OllamaInterface.query was not called exactly once.");
    }
    if(mockQuery.mock.calls[0][0] !== expectedPrompt)
    {
        throw new Error("OllamaInterface.query was called with the wrong prompt.");
    }
});