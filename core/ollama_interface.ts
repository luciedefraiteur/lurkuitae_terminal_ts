import {spawn} from 'child_process';
import os from 'os';
import { RituelContext } from './types.js';
import { generateWaitMessagePrompt } from './prompts/generateWaitMessagePrompt.js';

export enum OllamaModel
{
  CodeLlama = "codellama:7b-instruct",
  CodeLlamaCode = "codellama:7b-code",
  Llama3 = "llama3",
  Mistral = "mistral"
}

function escapeJson(input: string): string
{
  return input
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

function extractBetweenMarkers(input: string): string
{
  const match = input.match(/```([\s\S]*?)```/);
  return match ? match[1] : input;
}

export class OllamaInterface
{
  static async query(prompt: string, model: OllamaModel = OllamaModel.Mistral): Promise<string>
  {
    const isWindows = os.platform() === 'win32';
    const cleanPrompt = escapeJson(prompt);
    console.log(`[MODEL = ${ model }] cleanPrompt: ${ cleanPrompt }`);

    if(isWindows)
    {
      try
      {
        const body = {
          model,
          prompt: cleanPrompt,
          stream: false
        };

        const response = await fetch('http://127.0.0.1:11434/api/generate', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(body)
        });

        if(!response.ok)
        {
          const errorText = await response.text();
          throw new Error(`Erreur HTTP ${ response.status } : ${ errorText }`);
        }

        const json = await response.json() as {response?: string};
        const fullResponse = json.response ?? '';

        if(!fullResponse)
        {
          throw new Error("Erreur : réponse vide après parsing");
        }

        console.log("fullResponse:", fullResponse);
        return extractBetweenMarkers(fullResponse);
      } catch(err: any)
      {
        console.error("Erreur FETCH :", err);
        throw new Error(`[Erreur: ${ err.message }]`);
      }

    } else
    {
      return new Promise((resolve, reject) =>
      {
        const child = spawn('llm', ['--no-stream', '--model', model], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        const timeout = setTimeout(() =>
        {
          child.kill('SIGKILL');
          reject('[Timeout LLM : aucune réponse après 30 secondes]');
        }, 30000);

        child.stdout.on('data', (data) =>
        {
          stdout += data.toString();
        });

        child.stderr.on('data', (data) =>
        {
          stderr += data.toString();
        });

        child.on('error', (err) =>
        {
          clearTimeout(timeout);
          reject(`[Erreur LLM: ${ err.message }]`);
        });

        child.on('close', (code) =>
        {
          clearTimeout(timeout);
          if(code !== 0)
          {
            reject(`[LLM terminé avec code ${ code }] ${ stderr }`);
          } else
          {
            const result = stdout.trim();
            resolve(extractBetweenMarkers(result));
          }
        });

        child.stdin.write(prompt + '\n');
        child.stdin.end();
      });
    }
  }

  static async generateWaitMessage(context: RituelContext): Promise<string> {
    const prompt = generateWaitMessagePrompt(context);
    return this.query(prompt);
  }
}