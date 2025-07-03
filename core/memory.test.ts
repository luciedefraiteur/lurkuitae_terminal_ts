import { Memory } from './memory.js';
import { strict as assert } from 'assert';

function runTest(name: string, testFn: () => void) {
    try {
        testFn();
        console.log(`[PASS] ${name}`);
    } catch (error: any) {
        console.error(`[FAIL] ${name}`);
        console.error(`  Dissonance: ${error.message}`);
        if (error.actual !== undefined && error.expected !== undefined) {
            console.error(`  Attendu: ${error.expected}, Reçu: ${error.actual}`);
        }
        console.error(`  Trace: ${error.stack}`);
        process.exit(1);
    }
}

runTest('Memory.append should add an entry', () => {
    Memory.append('test entry');
    assert.ok(Memory.getContext().includes('test entry'));
});

runTest('Memory.getContext should return the full log', () => {
    Memory.append('entry 1');
    Memory.append('entry 2');
    const context = Memory.getContext();
    assert.ok(context.includes('entry 1'));
    assert.ok(context.includes('entry 2'));
});

runTest('Memory log should not exceed 10 entries', () => {
    for (let i = 0; i < 15; i++) {
        Memory.append(`entry ${i}`);
    }
    const context = Memory.getContext();
    const lines = context.split('\n');
    assert.strictEqual(lines.length, 10);
    assert.ok(context.includes('entry 14'));
    assert.ok(!context.includes('entry 4'));
});
