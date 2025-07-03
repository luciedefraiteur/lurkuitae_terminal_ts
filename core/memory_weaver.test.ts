import * as fs from 'fs/promises';
import * as path from 'path';
import {exploreBranch, createBranch, createLeaf, readLeaf, generateAndSaveMemoryFragment, appendToVector, enterReverie, updateConstellationMap} from './memory_weaver.js';
import {OllamaInterface} from './ollama_interface.js';

const TEST_MEMORY_ROOT = path.resolve(process.cwd(), 'core', 'mémoire_rituelle_test');

// Store original OllamaInterface.query
const originalOllamaQuery = OllamaInterface.query;

async function globalSetup()
{
    await fs.mkdir(TEST_MEMORY_ROOT, {recursive: true});
    await fs.mkdir(path.join(TEST_MEMORY_ROOT, 'fragments'), {recursive: true});

    // Mock OllamaInterface.query globally for all tests
    OllamaInterface.query = async (prompt: string) => {
        if (prompt.includes("Summarize the following event")) {
            return "A poetic summary of the event.";
        }
        return "Mocked Ollama response.";
    };
}

async function globalTeardown()
{
    await fs.rm(TEST_MEMORY_ROOT, {recursive: true, force: true});
    // Restore original OllamaInterface.query after all tests
    OllamaInterface.query = originalOllamaQuery;
}

async function runTest(name: string, testFn: () => Promise<void>)
{
    console.log(`--- Running Test: ${ name } ---`);
    try
    {
        await testFn();
        console.log(`[PASS] ${ name }`);
    } catch(error)
    {
        console.error(`[FAIL] ${ name }`, error);
    }
}

// Array to hold all tests
const tests: Array<() => Promise<void>> = [];

tests.push(async () => {
    await runTest("Create and Explore a Branch", async () =>
    {
        await createBranch('', 'test-branch', TEST_MEMORY_ROOT);
        const {branches} = await exploreBranch('', TEST_MEMORY_ROOT);
        if(!branches.includes('test-branch'))
        {
            throw new Error("Branch was not created.");
        }
    });
});

tests.push(async () => {
    await runTest("Create and Read a Leaf", async () =>
    {
        await createLeaf('', 'test-leaf', 'This is a test memory.', TEST_MEMORY_ROOT);
        const content = await readLeaf('test-leaf.md', TEST_MEMORY_ROOT);
        if(content !== 'This is a test memory.')
        {
            throw new Error("Leaf content is incorrect.");
        }
    });
});

tests.push(async () => {
    await runTest("Explore a Nested Structure", async () =>
    {
        await createBranch('', 'branch-1', TEST_MEMORY_ROOT);
        await createBranch('branch-1', 'branch-2', TEST_MEMORY_ROOT);
        await createLeaf('branch-1/branch-2', 'nested-leaf', 'A memory within a memory.', TEST_MEMORY_ROOT);

        const {branches} = await exploreBranch('branch-1', TEST_MEMORY_ROOT);
        if(!branches.includes('branch-2'))
        {
            throw new Error("Nested branch not found.");
        }

        const leafContent = await readLeaf('branch-1/branch-2/nested-leaf.md', TEST_MEMORY_ROOT);
        if(leafContent !== 'A memory within a memory.')
        {
            throw new Error("Nested leaf content is incorrect.");
        }
    });
});

tests.push(async () => {
    await runTest("generateAndSaveMemoryFragment should create a new leaf with poetic summary", async () => {
        const context = { narrativeState: { current: "test" } };
        const lastResult = { status: "success" };
        const branchPath = 'fragments';

        await generateAndSaveMemoryFragment(context as any, lastResult, branchPath, TEST_MEMORY_ROOT);

        const { leaves } = await exploreBranch(branchPath, TEST_MEMORY_ROOT);
        if (leaves.length === 0) {
            throw new Error("No memory fragment was created.");
        }
        const content = await readLeaf(path.join(branchPath, leaves[0]), TEST_MEMORY_ROOT);
        console.log("Actual content:", content);
        if (content !== "A poetic summary of the event.") {
            throw new Error("Memory fragment content is incorrect.");
        }
    });
});

tests.push(async () => {
    await runTest("appendToVector should append an entry to vector_of_intent.log", async () => {
        const context = {
            step_results_history: [{ output: "step output" }],
            historique: [{ input: "user input", plan: "current plan" }],
        };

        await appendToVector(context as any, TEST_MEMORY_ROOT);

        const vectorPath = path.join(TEST_MEMORY_ROOT, 'vector_of_intent.log');
        const content = await fs.readFile(vectorPath, 'utf8');
        const entry = JSON.parse(content.trim());

        if (entry.pastAction !== JSON.stringify({ output: "step output" })) {
            throw new Error("Vector entry pastAction is incorrect.");
        }
        if (entry.presentIntent !== "user input") {
            throw new Error("Vector entry presentIntent is incorrect.");
        }
        if (entry.futurePlan !== JSON.stringify("current plan")) {
            throw new Error("Vector entry futurePlan is incorrect.");
        }
    });
});

tests.push(async () => {
    await runTest("enterReverie should return concatenated content of random fragments", async () => {
        await createLeaf('fragments', 'fragment-1', 'Content of fragment 1.', TEST_MEMORY_ROOT);
        await createLeaf('fragments', 'fragment-2', 'Content of fragment 2.', TEST_MEMORY_ROOT);
        await createLeaf('fragments', 'fragment-3', 'Content of fragment 3.', TEST_MEMORY_ROOT);

        const reverie = await enterReverie(TEST_MEMORY_ROOT);

        if (!reverie.includes("A whisper from the past...")) {
            throw new Error("Reverie missing header.");
        }
        // Check if at least one of the fragments is included
        const fragmentContents = ["Content of fragment 1.", "Content of fragment 2.", "Content of fragment 3."];
        const foundFragment = fragmentContents.some(fragment => reverie.includes(fragment));
        if (!foundFragment) {
            throw new Error("Reverie missing fragment content.");
        }
    });
});

tests.push(async () => {
    await runTest("updateConstellationMap should update constellation_map.json", async () => {
        const context = {
            historique: [{
                input: "test input",
                plan: {
                    étapes: [{ type: "analysis", contenu: "test content" }],
                    complexité: "simple",
                    index: 0
                }
            }],
        };

        await updateConstellationMap(context as any, TEST_MEMORY_ROOT);

        const mapPath = path.join(TEST_MEMORY_ROOT, 'constellation_map.json');
        const content = await fs.readFile(mapPath, 'utf8');
        const map = JSON.parse(content);

        if (map.analysis !== 1) {
            throw new Error("Constellation map not updated correctly.");
        }

        // Test incrementing
        await updateConstellationMap(context as any, TEST_MEMORY_ROOT);
        const content2 = await fs.readFile(mapPath, 'utf8');
        const map2 = JSON.parse(content2);
        if (map2.analysis !== 2) {
            throw new Error("Constellation map not incremented correctly.");
        }
    });
});

async function executeAllTests() {
    await globalSetup();
    for (const test of tests) {
        await test();
    }
    await globalTeardown();
}

executeAllTests();
