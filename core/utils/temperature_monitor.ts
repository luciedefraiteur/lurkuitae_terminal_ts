import { OllamaInterface } from '../ollama_interface.js';
import { RituelContext } from '../types.js';

// ANSI escape codes for colors
const Colors = {
  Reset: "\x1b[0m",
  Bright: "\x1b[1m",
  Dim: "\x1b[2m",
  Underscore: "\x1b[4m",
  Blink: "\x1b[5m",
  Reverse: "\x1b[7m",
  Hidden: "\x1b[8m",

  FgRed: "\x1b[31m",
  FgBlue: "\x1b[34m",
};

function colorize(text: string, color: string): string
{
  return `${ color }${ text }${ Colors.Reset }`;
}

/**
 * Simule la vérification de la température du système et met à jour le contexte du rituel.
 * Si la température est jugée "trop élevée" (simulée), génère un message d'attente via l'IA et met le programme en pause.
 * @param context Le contexte du rituel.
 * @returns {Promise<void>} Une promesse qui se résout une fois la vérification et l'attente (si nécessaire) terminées.
 */
export async function checkSystemTemperature(context: RituelContext): Promise<void> {
  // TODO: Implémenter une logique réelle de vérification de la température du système.
  // Pour l'instant, nous allons simuler une condition de surchauffe aléatoire.

  const rand = Math.random();
  let newTemperatureStatus: 'normal' | 'elevated' | 'critical';

  if (rand < 0.7) {
    newTemperatureStatus = 'normal';
  } else if (rand < 0.9) {
    newTemperatureStatus = 'elevated';
  } else {
    newTemperatureStatus = 'critical';
  }

  context.temperatureStatus = newTemperatureStatus;

  if (newTemperatureStatus === 'elevated') {
    console.log(colorize("⚠️ Température du système élevée. Ralentissement rituel...", Colors.FgRed));
    const waitMessage = await OllamaInterface.generateWaitMessage(context);
    console.log(colorize(`
${waitMessage}
`, Colors.FgBlue));
    await new Promise(resolve => setTimeout(resolve, 3000)); // Attente de 3 secondes
    console.log(colorize("✅ Le système est prêt à reprendre le rituel.", Colors.FgBlue));
  } else if (newTemperatureStatus === 'critical') {
    console.log(colorize("🔥 Température du système CRITIQUE ! Pause rituelle forcée...", Colors.FgRed));
    const waitMessage = await OllamaInterface.generateWaitMessage(context);
    console.log(colorize(`
${waitMessage}
`, Colors.FgBlue));
    await new Promise(resolve => setTimeout(resolve, 15000)); // Attente de 15 secondes
    console.log(colorize("✅ Le système est prêt à reprendre le rituel.", Colors.FgBlue));
  }
}
