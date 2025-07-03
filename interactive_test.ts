import {spawn} from 'child_process';
import {Writable} from 'stream';

const child = spawn('npm', ['start'], {
    shell: true,
    stdio: ['pipe', 'pipe', 'pipe']
});

let outputBuffer = '';

const handleOutput = (data: Buffer) =>
{
    const text = data.toString();
    console.log(`[TERMINAL] ${ text }`);
    outputBuffer += text;

    // --- LOGIQUE DE RÉPONSE ---
    if(outputBuffer.includes('Choose a mode'))
    {
        const response = "1\n";
        console.log(`[MOI] Réponse : ${ response }`);
        child.stdin.write(response);
        outputBuffer = ''; // Clear buffer after responding
    } else if(outputBuffer.includes('Choose a model'))
    {
        const response = "1\n";
        console.log(`[MOI] Réponse : ${ response }`);
        child.stdin.write(response);
        outputBuffer = ''; // Clear buffer after responding
    } else if(outputBuffer.includes('Offre ton souffle'))
    {
        const response = "liste mes fichiers\n";
        console.log(`[MOI] Réponse : ${ response }`);
        child.stdin.write(response);
        outputBuffer = ''; // Clear buffer after responding
    }
};

child.stdout.on('data', handleOutput);
child.stderr.on('data', handleOutput);

child.on('close', (code) =>
{
    console.log(`\n--- Le rituel s'est terminé avec le code ${ code } ---`);
});

console.log("--- Lancement du test interactif ---");
// Pour ce test, je vais laisser le dialogue se dérouler.
// Je pourrais ajouter des timeouts ou des conditions de sortie plus complexes plus tard.