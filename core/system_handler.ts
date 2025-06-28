import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function handleSystemCommand(input: string): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(input);
    if (stderr) return `[Erreur stderr] ${stderr.trim()}`;
    return stdout.trim();
  } catch (error: any) {
    return `[Erreur d'exécution] ${error.message}`;
  }
}
