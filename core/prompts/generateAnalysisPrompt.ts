import {PlanRituel} from "../types.js";
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);

const ANALYSIS_PROMPT_TEMPLATE = fs.readFileSync(path.resolve(_dirname, '../prompts/static_parts/analysis_prompt_template.promptPart'), 'utf8');

export function generateAnalysisPrompt({output, index, plan, original_input}: {
    output: string,
    index: number,
    plan: PlanRituel,
    original_input: string
}): string
{
    const analysisPrefixes = [
        "L'écho de la commande révèle :",
        "Les arcanes du Terminal murmurent :",
        "Dans le miroir du shell, nous discernons :",
        "Lurkuitae perçoit :",
        "Le voile se lève sur :"
    ];
    const randomPrefix = analysisPrefixes[Math.floor(Math.random() * analysisPrefixes.length)];

    let promptContent = ANALYSIS_PROMPT_TEMPLATE;
    promptContent = promptContent.replace('{{randomPrefix}}', randomPrefix);
    promptContent = promptContent.replace('{{indexPlusOne}}', (index + 1).toString());
    promptContent = promptContent.replace('{{index}}', index.toString());
    promptContent = promptContent.replace('{{originalInput}}', original_input);
    promptContent = promptContent.replace('{{output}}', output);
    promptContent = promptContent.replace('{{plan}}', JSON.stringify(plan, null, 2));

    return promptContent.trim();
}