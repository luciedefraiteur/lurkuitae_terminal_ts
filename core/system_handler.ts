import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Exécute une commande système avec un répertoire courant facultatif.
 * @param input La commande shell à exécuter (ex: "ls -l").
 * @param cwd Le chemin absolu du répertoire depuis lequel exécuter.
 */
export async function handleSystemCommand(input: string, cwd: string): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(input, { cwd });
    if (stderr) return `[Erreur stderr] ${stderr.trim()}`;
    return stdout.trim();
  } catch (error: any) {
    return `[Erreur d'exécution] ${error.message}`;
  }
}