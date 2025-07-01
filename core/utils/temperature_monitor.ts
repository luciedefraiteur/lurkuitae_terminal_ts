import { OllamaInterface } from '../ollama_interface.js';
import { RituelContext } from '../types.js';
import { getCpuTemperature } from './temperature_sensor.js';
import { Colors, colorize } from './ui_utils.js';

/**
 * Vérifie la température du système et met à jour le contexte du rituel.
 * Si la température est jugée "trop élevée", génère un message d'attente via l'IA et met le programme en pause.
 * @param context Le contexte du rituel.
 * @returns {Promise<void>} Une promesse qui se résout une fois la vérification et l'attente (si nécessaire) terminées.
 */
export async function checkSystemTemperature(context: RituelContext): Promise<void> {
  const temperature = await getCpuTemperature();
  let newTemperatureStatus: 'normal' | 'elevated' | 'critical';

  if (temperature === null) {
    console.log(colorize("⚠️ Impossible de lire la température du CPU. Poursuite sans surveillance thermique.", Colors.FgYellow));
    newTemperatureStatus = 'normal'; // Assume normal if cannot read
  } else if (temperature <= 55) {
    newTemperatureStatus = 'normal';
  } else if (temperature > 55 && temperature <= 70) {
    newTemperatureStatus = 'elevated';
  } else {
    newTemperatureStatus = 'critical';
  }

  context.temperatureStatus = newTemperatureStatus;

  if (newTemperatureStatus === 'elevated') {
    console.log(colorize(`⚠️ Température du système élevée (${temperature}°C). Ralentissement rituel...`, Colors.FgRed));
    const waitMessage = await OllamaInterface.generateWaitMessage(context);
    console.log(colorize(`
${waitMessage}
`, Colors.FgBlue));
    await new Promise(resolve => setTimeout(resolve, 3000)); // Attente de 3 secondes
    console.log(colorize("✅ Le système est prêt à reprendre le rituel.", Colors.FgBlue));
  } else if (newTemperatureStatus === 'critical') {
    console.log(colorize(`🔥 Température du système CRITIQUE (${temperature}°C) ! Pause rituelle forcée...`, Colors.FgRed));
    const waitMessage = await OllamaInterface.generateWaitMessage(context);
    console.log(colorize(`
${waitMessage}
`, Colors.FgBlue));
    await new Promise(resolve => setTimeout(resolve, 90000)); // Attente de 90 secondes (1.5 minutes)
    console.log(colorize("✅ Le système est prêt à reprendre le rituel.", Colors.FgBlue));
  }
}
