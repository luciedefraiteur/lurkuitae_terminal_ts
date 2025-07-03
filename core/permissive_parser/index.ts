import {Tokenizer} from './tokenizer.js';
import {Parser} from './parser.js';
import {PlanRituel, Étape} from '../types.js';

/**
 * Adapts a loosely structured object from the LLM into a strict PlanRituel.
 * This prevents crashes when the LLM hallucinates a different schema.
 * @param data The raw parsed data from the LLM.
 * @returns A valid PlanRituel object or null if adaptation fails.
 */
function adaptToPlanRituel(data: any): PlanRituel | null
{
  if(!data || typeof data !== 'object')
  {
    return null;
  }

  // Case 1: It's already a valid PlanRituel (or close enough).
  if(data.hasOwnProperty('étapes') && Array.isArray(data.étapes))
  {
    return data as PlanRituel;
  }

  // Case 2: It's an array of steps (the hallucinated format) OR an array-like object from the permissive parser.
  let potentialArray: any[] | null = null;
  if(Array.isArray(data))
  {
    potentialArray = data;
  } else if(typeof data === 'object' && data !== null && data.hasOwnProperty('0'))
  {
    // It's likely an array-like object, e.g. { '0': {...}, '1': {...} }
    potentialArray = Object.values(data);
  }

  if(potentialArray)
  {
    const newÉtapes: Étape[] = potentialArray.map((item: any): Étape | null =>
    {
      if(!item || typeof item !== 'object') return null;

      // Attempt to map the hallucinated keys to our canonical keys.
      const type = item.type || item.step || item.action;
      const contenu = item.contenu || item.command || item.description;

      if(!type || !contenu) return null;

      return {
        type: type,
        contenu: contenu,
      };
    }).filter((e): e is Étape => e !== null);

    if(newÉtapes.length > 0)
    {
      return {
        étapes: newÉtapes,
        complexité: 'simple', // Default complexity
        index: (potentialArray[0] && potentialArray[0].index) || 0, // Try to get index from first step, or default to 0
      };
    }
  }

  // Case 3: It's a single step object, not wrapped in a plan.
  if(data.hasOwnProperty('type') && data.hasOwnProperty('contenu'))
  {
    const etape: Étape = {
      type: data.type,
      contenu: data.contenu,
    };
    return {
      étapes: [etape],
      complexité: data.complexité || 'simple',
      index: data.index || 0,
    };
  }

  return null; // If it's an unknown object format
}

export const parse = (text: string): PlanRituel | null =>
{
  try
  {
    const tokens = Tokenizer.tokenize(text);
    const parser = new Parser(tokens);
    const result = parser.parse();

    const adaptedResult = adaptToPlanRituel(result);
    if(!adaptedResult)
    {
      console.error(`[PARSER ADAPTER] Impossible d'adapter la sortie du LLM en PlanRituel valide. Sortie brute:`, JSON.stringify(result));
    }
    return adaptedResult;

  } catch(ex: any)
  {
    if(typeof ex.type === 'number')
    {
      throw ex;
    } else
    {
      throw ex;
    }
  }
};
