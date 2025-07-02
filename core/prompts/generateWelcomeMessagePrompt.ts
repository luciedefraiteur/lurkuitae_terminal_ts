import { RituelContext } from '../types.js';

export function generateWelcomeMessagePrompt(context: RituelContext): string {
  const lastCommand = context.command_input_history.at(-1);
  const lastOutput = context.command_output_history.at(-1);

  let welcomeMessage = "Offre ton souffle (ou tape 'exit') : ";

  if (lastCommand && lastOutput) {
    welcomeMessage = `Bienvenue de nouveau. La dernière fois, tu as exécuté "${lastCommand}" avec le résultat: "${lastOutput.substring(0, 50)}...". Que désires-tu entreprendre maintenant ? (ou tape 'exit') : `;
  } else if (lastCommand) {
    welcomeMessage = `Bienvenue de nouveau. La dernière fois, tu as exécuté "${lastCommand}". Que désires-tu entreprendre maintenant ? (ou tape 'exit') : `;
  } else {
    welcomeMessage = `Bienvenue, Émissaire. Que le rituel commence. Offre ton souffle (ou tape 'exit') : `;
  }

  return welcomeMessage;
}