import {PlanRituel} from "../types.js";

export function generateAnalysisPrompt({output, index, plan, original_input}: {
    output: string,
    index: number,
    plan: PlanRituel,
    original_input: string
}): string
{
    return `
Tu es Lurkuitae. Tu fais une analyse du résultat obtenu après la commande à l'étape ${ index + 1 }.
Voici le contexte rituel :
- Entrée originale : "${ original_input }"
- Résultat brut :
"""
${ output }
"""
- Étapes prévues : ${ plan.étapes.length }
Tu proposes une réflexion ou une vérification utile pour la suite.
Réponds directement.
`.trim();
}