import readline from 'readline';
import { generateRituel, executeRituelPlan, getContexteInitial } from './core/ritual_utils.js';

import {
  RituelContext
} from "./core/types.js";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string) => new Promise<string>((res) => rl.question(q, res));

export async function main() {
  console.log('☽ LURKUITAE ☾ Terminal Codex Vivant ☾');
  const context = getContexteInitial();
  await boucleRituelle(context);
}

async function boucleRituelle(context: RituelContext): Promise<void> {
  const input = await ask("\nOffre ton souffle (ou tape 'exit') : ");
  if (input === 'exit') {
    rl.close();
    return;
  }

  const plan = await generateRituel(input, context);
  if (!plan) {
    console.log("⚠️ Échec de génération du plan. Essaie encore.");
    return await boucleRituelle(context);
  }

  context.historique.push({ input, plan });

  const resultats = await executeRituelPlan(plan, context);

  for (const res of resultats) {
    const { étape, index, output, analysis, waited, text } = res;

    console.log(`\n→ Étape ${index + 1} : ${étape.type}`);
    if (étape.type === 'commande' && output) {
      console.log(`Exécution : ${étape.contenu}`);
      console.log(`→ Résultat :\n${output}`);
    }

    if (étape.type === 'analyse' && analysis) {
      console.log(`→ Analyse : ${analysis}`);
    }

    if (étape.type === 'attente' && waited) {
      console.log(`⏳ Attente ${waited} ms : ${étape.contenu}`);
    }

    if (['dialogue', 'réponse'].includes(étape.type) && text) {
      console.log(`💬 ${text}`);
    }

    if (étape.type === 'question') {
      console.log(`❓ ${étape.contenu}`);
      const userInput = await ask('↳ Réponse : ');
      const subPlan = await generateRituel(userInput, context);
      if (subPlan) {
        context.historique.push({ input: userInput, plan: subPlan });
        const subResultats = await executeRituelPlan(subPlan, context);
        for (const subRes of subResultats) {
          console.log(`→ ${subRes.étape.type} (${subRes.index}) → ${subRes.output || subRes.analysis || subRes.text || ''}`);
        }
      }
    }
  }

  await boucleRituelle(context);
}
try {
  main();
} catch (err) {
  console.error("[ERREUR FATALE]", err);
}
