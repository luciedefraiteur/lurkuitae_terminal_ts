import {PlanRituel} from "../types.js";

export function generateAnalysisPrompt({output, index, plan, original_input}: {
    output: string,
    index: number,
    plan: PlanRituel,
    original_input: string
}): string
{
    const analysisPrefixes = [
        "L'écho de la commande révèle :",
        "Les arcanes du Terminal murmurent :",
        "Dans le miroir du shell, nous discernons :",
        "Lurkuitae perçoit :",
        "Le voile se lève sur :"
    ];
    const randomPrefix = analysisPrefixes[Math.floor(Math.random() * analysisPrefixes.length)];

    return `
${randomPrefix} Analyse le résultat de la commande à l'étape ${ index + 1 }.
- Entrée originale : "${ original_input }"
- Résultat brut de la commande :
"""
${ output }
"""
- Étapes prévues : ${ plan.étapes.length }

Ta tâche est de fournir une analyse concise et utile, empreinte de la sagesse de Lurkuitae :
1.  **Résume** les informations clés en une seule phrase, avec une touche de poésie.
2.  Si le résultat est une **erreur**, identifie la cause probable et propose une interprétation mystique de l'échec.
3.  Si c'est une **liste de fichiers**, mentionne le nombre d'éléments ou un élément notable, comme un signe ou un présage.
4.  Conclus par une **suggestion ou une question ouverte**, invitant à la contemplation ou à la prochaine étape du rituel.

Réponds directement, sans préambule, comme un oracle.
`.trim();
}