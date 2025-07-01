import { exec } from 'child_process';
import { promisify } from 'util';
import { CommandResult } from './types.js';
import { detectWindowsShell, ShellType } from './utils/shell_detector.js';
import os from 'os';

const execAsync = promisify(exec);

/**
 * Exécute une commande système avec un répertoire courant facultatif.
 * @param input La commande shell à exécuter (ex: "ls -l").
 * @param cwd Le chemin absolu du répertoire depuis lequel exécuter.
 */
export async function handleSystemCommand(input: string, cwd: string, _execAsync: (command: string, options: any) => Promise<{ stdout: string; stderr: string }> = execAsync): Promise<CommandResult> {
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
    return {
      success: true,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exitCode: 0,
    };
  } catch (error: any) {
    return {
      success: false,
      stdout: (error.stdout || '').trim(),
      stderr: (error.stderr || '').trim(),
      exitCode: error.code || null,
      error: error.message,
    };
  }
}