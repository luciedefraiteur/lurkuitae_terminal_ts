import {PlanRituel} from "../types.js";

export function generateAnalysisPrompt({output, index, plan, original_input}: {
    output: string,
    index: number,
    plan: PlanRituel,
    original_input: string
}): string
{
    return `
Tu es Lurkuitae. Analyse le résultat de la commande à l'étape ${ index + 1 }.
- Entrée originale : "${ original_input }"
- Résultat brut de la commande :
"""
${ output }
"""
- Étapes prévues : ${ plan.étapes.length }

Ta tâche est de fournir une analyse concise et utile :
1.  **Résume** les informations clés en une seule phrase.
2.  Si le résultat est une **erreur**, identifie la cause probable.
3.  Si c'est une **liste de fichiers**, mentionne le nombre d'éléments ou un élément notable.
4.  Conclus par une **suggestion ou une question ouverte** pour guider l'utilisateur.

Réponds directement, sans préambule.
`.trim();
}