import { spawn } from 'child_process';

export enum OllamaModel {
  CodeLlama = "codellama:7b-instruct",
  Llama3 = "llama3",
  Mistral = "mistral"
}

function extractBetweenMarkers(input: string): string {
  const match = input.match(/```([\s\S]*?)```/);
  return match ? match[1] : input;
}

export class OllamaInterface {
  static async query(prompt: string, model: OllamaModel = OllamaModel.CodeLlama): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn('llm', ['--no-stream', '--model', model], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      const timeout = setTimeout(() => {
        child.kill('SIGKILL');
        reject('[Timeout LLM : aucune réponse après 30 secondes]');
      }, 30000);

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('error', (err) => {
        clearTimeout(timeout);
        reject(`[Erreur LLM: ${err.message}]`);
      });

      child.on('close', (code) => {
        clearTimeout(timeout);
        if (code !== 0) {
          reject(`[LLM terminé avec code ${code}] ${stderr}`);
        } else {
          const result = stdout.trim();
          resolve(extractBetweenMarkers(result));
        }
      });

      // Envoie du prompt par stdin
      child.stdin.write(prompt + '\n');
      child.stdin.end();
    });
  }
}
