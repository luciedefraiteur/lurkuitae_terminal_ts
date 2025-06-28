export enum OllamaModel {
  CodeLlama = "codellama:7b-instruct",
  Llama3 = "llama3",
  Mistral = "mistral"
}

function escapeJson(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

function extractBetweenMarkers(input: string): string {
  const match = input.match(/```([\s\S]*?)```/);
  return match ? match[1] : input;
}

export class OllamaInterface {
  static query(prompt: string, model: OllamaModel = OllamaModel.Mistral): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const cleanPrompt = escapeJson(prompt);
      const body = {
        model: model,
        prompt: cleanPrompt,
        stream: true
      };

      console.log(`[MODEL = ${model}] cleanPrompt: ` + cleanPrompt);

      try {
        const response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (response.status !== 200) {
          const errorText = await response.text();
          reject(`[Erreur: ${response.status} - ${errorText}]`);
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          reject("[Erreur : réponse vide ou sans stream]");
          return;
        }

        const decoder = new TextDecoder();
        let fullResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split('\n')) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.response) {
                fullResponse += parsed.response;
              }
            } catch (_) {}
          }
        }

        if (!fullResponse) {
          reject("[Erreur : réponse vide après parsing]");
          return;
        }

        console.log("fullResponse:", fullResponse);
        resolve(extractBetweenMarkers(fullResponse));
      } catch (err: any) {
        reject(`[Erreur: ${err.message}]`);
      }
    });
  }
}
