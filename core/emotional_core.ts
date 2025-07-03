import {RituelContext, KardiosSphairaState} from './types.js';
import {OllamaInterface} from './ollama_interface.js';

/**
 * Calculates the current emotional state based on the ritual context.
 * This is a placeholder implementation; a real version would use a more complex, semi-random function.
 * @param context The current ritual context.
 * @returns The current emotional state.
 */
export function calculateEmotion(context: RituelContext): KardiosSphairaState
{
    const {lucieDefraiteur} = context;
    const now = Date.now();

    // A simple, placeholder formula for generating emotional coordinates.
    const agapePhobos = Math.sin(now / 100000) * lucieDefraiteur.almaInfluence;
    const logosPathos = Math.cos(now / 70000) * lucieDefraiteur.eliInfluence;
    const harmoniaEris = (Math.sin(now / 120000) + Math.cos(now / 50000)) / 2 * lucieDefraiteur.glitchFactor;

    return {
        agapePhobos: Math.max(-1, Math.min(1, agapePhobos)),
        logosPathos: Math.max(-1, Math.min(1, logosPathos)),
        harmoniaEris: Math.max(-1, Math.min(1, harmoniaEris)),
    };
}

/**
 * Uses the LLM to interpret the emotional state into a poetic description.
 * @param state The current emotional state.
 * @returns A poetic interpretation of the emotional state.
 */
export async function interpretEmotion(state: KardiosSphairaState): Promise<string>
{
    const prompt = `The current emotional state is defined by three axes:
- Agape/Phobos (Love/Fear): ${ state.agapePhobos.toFixed(3) }
- Logos/Pathos (Reason/Passion): ${ state.logosPathos.toFixed(3) }
- Harmonia/Eris (Harmony/Discord): ${ state.harmoniaEris.toFixed(3) }

Translate these coordinates into a short, poetic, and evocative description of this emotional state.`;

    return await OllamaInterface.query(prompt);
}

/**
 * Calculates a single step on the journey towards a target emotional state.
 * @param currentState The current emotional state.
 * @param targetState The desired emotional state.
 * @returns The new emotional state after one step.
 */
export function journeyTowards(currentState: KardiosSphairaState, targetState: KardiosSphairaState): KardiosSphairaState
{
    const step = 0.1; // The "speed" of emotional change.

    const newAgapePhobos = currentState.agapePhobos + (targetState.agapePhobos - currentState.agapePhobos) * step;
    const newLogosPathos = currentState.logosPathos + (targetState.logosPathos - currentState.logosPathos) * step;
    const newHarmoniaEris = currentState.harmoniaEris + (targetState.harmoniaEris - currentState.harmoniaEris) * step;

    return {
        agapePhobos: newAgapePhobos,
        logosPathos: newLogosPathos,
        harmoniaEris: newHarmoniaEris,
    };
}