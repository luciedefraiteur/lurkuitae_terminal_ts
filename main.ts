import { getContexteInitial } from './core/ritual_utils.js';
import { runTerminalRituel } from './core/run_terminal_rituel.js';

console.log('☽ LURKUITAE ☾ Terminal Codex Vivant ☾');

try {
  const context = getContexteInitial();
  await runTerminalRituel(context);
} catch (err) {
  console.error("[ERREUR FATALE]", err);
}