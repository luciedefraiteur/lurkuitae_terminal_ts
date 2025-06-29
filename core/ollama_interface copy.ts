export enum OllamaModel
{
  CodeLlama = "codellama:7b-instruct",
  Llama3 = "llama3",
  Mistral = "mistral"
}

function escapeJson(input: string): string
{
  return input
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
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
    const cleanPrompt = escapeJson(prompt);
    const body = {
      model,
      prompt: cleanPrompt,
      stream: false // ✅ Important pour compatibilité Windows + Node
    };

    console.log(`[MODEL = ${ model }] cleanPrompt: ${ cleanPrompt }`);

    try
    {
      // ⚠️ IPv4 forcé ici pour éviter résolution vers ::1
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
  }
}
