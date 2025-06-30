// server.ts - version serveur HTTP + API Web du terminal Lurkuitae

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import {handleSystemCommand} from './core/system_handler.js';
import {OllamaInterface} from './core/ollama_interface.js';
import {
  getContexteInitial,
  safeQuery,
  executeRituelPlan,
  RituelContext,
  PlanRituel,
  generateRituel
} from './core/ritual_utils.js';

const app = express();
const port = process.env.PORT || 3030;

app.use(cors());
app.use(bodyParser.json());

const context: RituelContext = getContexteInitial();

app.post('/rituel', async (req, res) => {
  const input = req.body.input;
  if (!input) return res.status(400).json({error: 'Input manquant'});

  const plan = await generateRituel(input, context);
  if (!plan) return res.status(500).json({error: 'Erreur de planification'});

  context.historique.push({input, plan});
  res.json({plan});
});

app.post('/execute', async (req, res) => {
  const plan: PlanRituel = req.body.plan;
  const resultats = await executeRituelPlan(plan, context);
  res.json({resultats});
});

app.listen(port, () => {
  console.log(`[INFO] ✨ Serveur Lurkuitae en écoute sur http://localhost:${port}`);
});
