import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {Étape, RituelContext} from '../types.js';
import {Personas} from '../personas.js';

const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);

const REMEDIATION_RITUAL_PROMPT = fs.readFileSync(path.resolve(_dirname, './static_parts/remediation_ritual.promptPart'), 'utf8');

export function generateRemediationPrompt(failedStep: Étape, errorOutput: string, context: RituelContext): string
{
    const persona = Personas.Healer(context);

    let prompt = REMEDIATION_RITUAL_PROMPT;
    prompt = prompt.replace('{{failedStep}}', JSON.stringify(failedStep, null, 2));
    prompt = prompt.replace('{{errorOutput}}', errorOutput);

    return `${ persona }\n\n${ prompt }`;
}