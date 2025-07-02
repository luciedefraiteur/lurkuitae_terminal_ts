import JSON5 from 'json5';
import { z, ZodError } from 'zod';

/**
 * Analyse une chaîne JSON de manière permissive en utilisant JSON5.
 * Valide le résultat par rapport à un schéma Zod optionnel.
 *
 * @template T
 * @param {string} jsonString La chaîne JSON à analyser.
 * @param {z.ZodType<T>} [schema] Le schéma Zod optionnel pour la validation.
 * @returns {T} L'objet analysé et validé.
 * @throws {Error} Si l'analyse échoue ou si la validation du schéma échoue.
 */
export function parsePermissive<T>(jsonString: string, schema?: z.ZodType<T>): T {
  try {
    const parsed = JSON5.parse(jsonString);

    if (schema) {
      return schema.parse(parsed);
    }

    return parsed as T;
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`Erreur de validation du schéma JSON : ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }
    // Pour les erreurs d'analyse JSON5 ou autres erreurs inattendues
    const errorMessage = (error instanceof Error) ? error.message : String(error);
    throw new Error(`Échec de l'analyse JSON permissive : ${errorMessage}`);
  }
}
