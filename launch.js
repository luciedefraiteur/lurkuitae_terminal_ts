import { spawn } from 'child_process';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import * as readline from 'readline';

const ask = (rl, q) => new Promise(resolve => rl.question(q, resolve));

async function main() {
    let argv = yargs(hideBin(process.argv))
        .option('mode', {
            alias: 'm',
            type: 'string',
            description: 'The personality to use (lurkuitae or lucie)',
            choices: ['lurkuitae', 'lucie'],
        })
        .option('model', {
            alias: 'o',
            type: 'string',
            description: 'The Ollama model to use',
        })
        .help()
        .alias('help', 'h')
        .argv;

    let { mode, model } = argv;

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    if (!mode) {
        const answer = await ask(rl, 'Choose a mode (1: lurkuitae (default), 2: lucie): ');
        mode = answer.trim() === '2' ? 'lucie' : 'lurkuitae';
    }

    if (!model) {
        const availableModels = ['mistral', 'llama3', 'codellama:7b-instruct', 'random'];
        console.log('Available models:');
        console.log('1: mistral (default)');
        console.log('2: llama3');
        console.log('3: codellama:7b-instruct');
        console.log('4: random');
        const answer = await ask(rl, 'Choose a model: ');
        switch(answer.trim()) {
            case '2':
                model = 'llama3';
                break;
            case '3':
                model = 'codellama:7b-instruct';
                break;
            case '4':
                model = 'random';
                break;
            default:
                model = 'mistral';
        }
    }

    rl.close();

    const command = 'node';
    const args = [
        '--trace-warnings',
        '--loader',
        'ts-node/esm',
        'main.ts',
        '--mode',
        mode,
        '--model',
        model
    ];

    console.log(`\nExecuting: ${command} ${args.join(' ')}\n`);

    const child = spawn(command, args, {
        stdio: 'inherit',
        shell: true
    });

    child.on('close', (code) => {
        console.log(`\nChild process exited with code ${code}`);
    });

    child.on('error', (err) => {
        console.error('\nFailed to start child process.', err);
    });
}

main();