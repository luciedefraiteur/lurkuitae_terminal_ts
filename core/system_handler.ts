import { exec } from 'child_process';
import { promisify } from 'util';
import { CommandResult } from './types.js';

const execAsync = promisify(exec);

/**
 * Exécute une commande système avec un répertoire courant facultatif.
 * @param input La commande shell à exécuter (ex: "ls -l").
 * @param cwd Le chemin absolu du répertoire depuis lequel exécuter.
 */
export async function handleSystemCommand(input: string, cwd: string): Promise<CommandResult> {
  try {
    const { stdout, stderr } = await execAsync(input, { cwd });
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