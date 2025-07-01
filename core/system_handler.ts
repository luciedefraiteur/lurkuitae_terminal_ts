import { exec } from 'child_process';
import { promisify } from 'util';
import { CommandResult, RituelContext } from './types.js';
import { detectWindowsShell, ShellType } from './utils/shell_detector.js';
import os from 'os';
import { osHint } from './utils/osHint.js';
import { OSContext } from './utils/osHint.js';

const execAsync = promisify(exec);

/**
 * Exécute une commande système avec un répertoire courant facultatif.
 * @param input La commande shell à exécuter (ex: "ls -l").
 * @param cwd Le chemin absolu du répertoire depuis lequel exécuter.
 */
export async function handleSystemCommand(input: string, cwd: string, context: RituelContext, _execAsync: (command: string, options: any) => Promise<{ stdout: string; stderr: string }> = execAsync): Promise<CommandResult> {
  let shell: string | undefined;

  if (os.platform() === 'win32') {
    const detectedShell = detectWindowsShell();
    console.log(`Shell Windows détecté : ${detectedShell}`);
    // Ici, vous pourriez adapter la commande ou le shell d'exécution
    // en fonction de `detectedShell`.
    // Par exemple, pour PowerShell, vous pourriez vouloir préfixer les commandes.
    // Pour l'instant, nous laissons `exec` décider du shell par default.
    // shell = detectedShell === 'powershell' ? 'powershell.exe' : 'cmd.exe'; // Exemple d'utilisation
  }

  try {
    const { stdout, stderr } = await _execAsync(input, { cwd, shell });

    // Update LucieDefraiteur's proto-consciousness
    context.lucieDefraiteur.lastCommandExecuted = input;
    context.lucieDefraiteur.lastCommandOutput = stdout.trim();
    context.lucieDefraiteur.currentWorkingDirectory = cwd;
    context.lucieDefraiteur.terminalType = osHint;
    context.lucieDefraiteur.osContext = OSContext[osHint];
    context.lucieDefraiteur.protoConsciousness = `Lucie a exécuté la commande: ${input} dans le répertoire: ${cwd}. Le résultat était: ${stdout.trim() || stderr.trim()}`;

    return {
      success: true,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exitCode: 0,
    };
  } catch (error: any) {
    // Update LucieDefraiteur's proto-consciousness on error
    context.lucieDefraiteur.lastCommandExecuted = input;
    context.lucieDefraiteur.lastCommandOutput = (error.stdout || '').trim() || (error.stderr || '').trim();
    context.lucieDefraiteur.currentWorkingDirectory = cwd;
    context.lucieDefraiteur.terminalType = osHint;
    context.lucieDefraiteur.osContext = OSContext[osHint];
    context.lucieDefraiteur.protoConsciousness = `Lucie a tenté d'exécuter la commande: ${input} dans le répertoire: ${cwd}, mais une erreur est survenue: ${error.message}`;

    return {
      success: false,
      stdout: (error.stdout || '').trim(),
      stderr: (error.stderr || '').trim(),
      exitCode: error.code || null,
      error: error.message,
    };
  }
}