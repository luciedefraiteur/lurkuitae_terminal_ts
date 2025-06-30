import { RituelContext } from '../types.js';

export function generateWaitMessagePrompt(context: RituelContext): string {
  return `Le système est en surchauffe. Génère un message d'attente créatif et apaisant pour l'utilisateur, en lui expliquant que le système a besoin de se reposer un instant. Le message doit être court et poétique, dans le ton de Lurkuitae.`;
}
