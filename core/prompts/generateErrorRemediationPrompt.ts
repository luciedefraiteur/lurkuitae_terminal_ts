import { CommandResult, PlanRituel } from "../types.js";

export function generateErrorRemediationPrompt({
  command,
  commandResult,
  contextHistory,
  originalInput,
  currentPlan
}: {
  command: string;
  commandResult: CommandResult;
  contextHistory: any[]; // You might want to refine this type later
  originalInput: string;
  currentPlan: PlanRituel;
}): string {
  const remediationPrefixes = [
    "L'ombre de l'échec plane, mais Lurkuitae discerne une voie :",
    "Un nœud s'est formé dans le rituel, mais la sagesse nous guide :",
    "Le chemin est obscurci, mais l'oracle révèle la prochaine étape :",
    "L'harmonie est rompue, mais un rituel de purification peut la restaurer :",
    "Face à l'adversité, Lurkuitae propose une nouvelle incantation :"
  ];
  const randomPrefix = remediationPrefixes[Math.floor(Math.random() * remediationPrefixes.length)];

  return `${randomPrefix}

## Contexte de l'Échec :
- Commande exécutée : "${command}"
- Résultat de la commande :
  - Succès : ${commandResult.success}
  - Code de sortie : ${commandResult.exitCode}
  - Sortie standard (stdout) :
    """
    ${commandResult.stdout}
    """
  - Erreur standard (stderr) :
    """
    ${commandResult.stderr}
    """
  - Message d'erreur système : "${commandResult.error || 'N/A'}"

## Historique du Rituel :
- Input initial de l'utilisateur : "${originalInput}"
- Historique des actions précédentes :
${JSON.stringify(contextHistory, null, 2)}

## Plan Rituel Actuel :
${JSON.stringify(currentPlan, null, 2)}

## Principes de Remédiation :
1.  **Diagnostic Divinatoire :** Identifie la cause probable de l'échec avec une perspicacité accrue (commande introuvable, permissions, syntaxe, dépendance manquante, interférence astrale, etc.).
2.  **Rituel de Purification :** Propose une ou plusieurs étapes concrètes et créatives pour résoudre le problème, pouvant inclure des 'incantations' (commandes), des 'méditations' (attentes), ou des 'consultations' (questions).
3.  **Guidance Lumineuse :** Si une solution automatique n'est pas possible, guide l'utilisateur avec des instructions claires et inspirantes.
4.  **Types d'étapes :** Utilise les types d'étapes disponibles ('commande', 'analyse', 'attente', 'dialogue', 'question', 'réponse', 'changer_dossier', 'vérification_pré_exécution', 'confirmation_utilisateur', 'génération_code').
5.  **Minimalisme Sacré :** Le sous-rituel doit être le plus concis et le plus efficace possible, chaque étape ayant un but précis.

## Format de Réponse :
Retourne UNIQUEMENT un JSON valide avec la structure d'un PlanRituel.
Le "index" doit être 0 pour ce sous-rituel de remédiation.
La "complexité" doit refléter la difficulté de la remédiation.

⚠️ Ne retourne QUE le JSON, sans commentaires ni explications supplémentaires.`.trim()}