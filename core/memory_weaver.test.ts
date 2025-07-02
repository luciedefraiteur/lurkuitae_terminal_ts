import * as fs from 'fs/promises';
import * as path from 'path';
import {exploreBranch, createBranch, createLeaf, readLeaf} from './memory_weaver.js';

const TEST_MEMORY_ROOT = path.resolve(process.cwd(), 'core', 'mémoire_rituelle_test');

async function setup()
{
    await fs.mkdir(TEST_MEMORY_ROOT, {recursive: true});
}

async function teardown()
{
    await fs.rm(TEST_MEMORY_ROOT, {recursive: true, force: true});
}

async function runTest(name: string, testFn: () => Promise<void>)
{
    console.log(`--- Running Test: ${ name } ---`);
    await setup();
    try
    {
        await testFn();
        console.log(`[PASS] ${ name }`);
    } catch(error)
    {
        console.error(`[FAIL] ${ name }`, error);
    } finally
    {
        await teardown();
    }
}

runTest("Create and Explore a Branch", async () =>
{
    await createBranch('', 'test-branch', TEST_MEMORY_ROOT);
    const {branches} = await exploreBranch('', TEST_MEMORY_ROOT);
    if(!branches.includes('test-branch'))
    {
        throw new Error("Branch was not created.");
    }
});

runTest("Create and Read a Leaf", async () =>
{
    await createLeaf('', 'test-leaf', 'This is a test memory.', TEST_MEMORY_ROOT);
    const content = await readLeaf('test-leaf.md', TEST_MEMORY_ROOT);
    if(content !== 'This is a test memory.')
    {
        throw new Error("Leaf content is incorrect.");
    }
});

runTest("Explore a Nested Structure", async () =>
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