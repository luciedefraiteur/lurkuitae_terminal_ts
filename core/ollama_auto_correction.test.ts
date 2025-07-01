import { handleCommande } from './ritual_step_handlers.js';
import { OllamaInterface, OllamaModel } from './ollama_interface.js';
import { RituelContext, PlanRituel, CommandResult } from './types.js';

// Helper for assertions
function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Test Failed: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ Test Passed: ${message}`);
  }
}

async function runOllamaAutoCorrectionTests() {
  console.log("\n--- Running Custom Unit Tests for Ollama Auto-Correction ---\n");

  // Scenario: Invalid JSON from llama-instruct, then corrected by mistral
  let callCount = 0;
  const mockFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    callCount++;
    if (callCount === 1) {
      // Simulate invalid JSON from llama-instruct
      return new Response(`{
  "étapes": [
    {
      "type": "commande",
      "contenu": "echo 'JSON invalide"
    }
  ]
`, { status: 200 }); // Incomplete JSON
    } else if (callCount === 2) {
      // Simulate valid JSON from mistral
      return new Response(`{
  "étapes": [
    {
      "type": "commande",
      "contenu": "echo 'JSON invalide corrigé'"
    }
  ]
}`, { status: 200 });
    }
    return new Response('', { status: 500 }); // Should not be reached
  };

  const context: RituelContext = {
    historique: [],
    command_input_history: [],
    command_output_history: [],
    current_directory: '/tmp',
    temperatureStatus: 'normal',
  };

  const plan: PlanRituel = {
    étapes: [{
      type: 'commande',
      contenu: 'test'
    }],
    complexité: 'simple',
    index: 0,
  };

  const commandResult: CommandResult = {
    success: false,
    stdout: '',
    stderr: 'Command failed',
    exitCode: 1,
    error: 'Command failed',
  };

  // Temporarily override OllamaInterface.query to use our mockFetch
  const originalQuery = OllamaInterface.query;
  OllamaInterface.query = async (prompt: string, model: OllamaModel, _fetch: typeof fetch = mockFetch) => {
    // We need to ensure the model is correctly passed for assertions
    if (callCount === 1) {
      assert(model === OllamaModel.CodeLlama, 'Test 1: First call should be to CodeLlama');
    } else if (callCount === 2) {
      assert(model === OllamaModel.Mistral, 'Test 1: Second call should be to Mistral for correction');
    }
    // Call the original query logic but with our mocked fetch
    return originalQuery.call(OllamaInterface, prompt, model, _fetch);
  };

  const result = await handleCommande({
    type: 'commande',
    contenu: 'test_command'
  }, context, plan);

  assert(result.remediationResults !== undefined, 'Test 1: Remediation results should be present');
  assert(result.remediationError === undefined, 'Test 1: No remediation error after correction');

  // Restore original OllamaInterface.query
  OllamaInterface.query = originalQuery;

  console.log("\n--- All Custom Unit Tests for Ollama Auto-Correction Passed ---");
}

// Run all tests
async function runAllTests() {
  await runOllamaAutoCorrectionTests();
  console.log("\n--- All Custom Unit Tests Completed ---");
}

runAllTests().catch(error => {
  console.error("An error occurred during testing:", error);
  process.exit(1);
});