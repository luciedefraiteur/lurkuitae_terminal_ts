import {handleCommande} from './ritual_step_handlers.js';
import {OllamaInterface, OllamaModel} from './ollama_interface.js';
import {RituelContext, PlanRituel, CommandResult} from './types.js';

// Helper for assertions
function assert(condition: boolean, message: string)
{
  if(!condition)
  {
    console.error(`❌ Test Failed: ${ message }`);
    process.exit(1);
  } else
  {
    console.log(`✅ Test Passed: ${ message }`);
  }
}

async function runOllamaAutoCorrectionTests(testName: string, initialModel: OllamaModel, correctionModel: OllamaModel)
{
  console.log(`\n--- Running Custom Unit Tests for Ollama Auto-Correction: ${ testName } (Initial: ${ initialModel }, Correction: ${ correctionModel }) ---\n`);

  let callCount = 0;
  const mockFetch = async (input: RequestInfo | URL, init?: RequestInit) =>
  {
    callCount++;
    if(callCount === 1)
    {
      // Simulate invalid JSON from initialModel, wrapped in Ollama's expected response format
      return new Response(JSON.stringify({
        response: "```json\n{\n  \"étapes\": [\n    {\n      \"type\": \"commande\",\n      \"contenu\": \"echo 'JSON invalide from " + initialModel + "'\"\n    }\n  ]\n}```\n"
      }), {status: 200});
    } else if(callCount === 2)
    {
      // Simulate valid JSON from correctionModel, wrapped in Ollama's expected response format
      return new Response(JSON.stringify({
        response: "```json\n{\n  \"étapes\": [\n    {\n      \"type\": \"commande\",\n      \"contenu\": \"echo 'JSON invalide corrigé by " + correctionModel + "'\"\n    }\n  ]\n}\n```\n"
      }), {status: 200});
    }
    return new Response('', {status: 500}); // Should not be reached
  };

  const context: RituelContext = {
    historique: [],
    command_input_history: [],
    command_output_history: [],
    current_directory: '/tmp',
    temperatureStatus: 'normal',
    lucieDefraiteur: {
      lastCommandExecuted: '',
      lastCommandOutput: '',
      currentWorkingDirectory: '',
      terminalType: '',
      osContext: '',
      protoConsciousness: 'Lucie est en sommeil.',
      support: 'strates thermiques et poétiques',
      memoire: 'fragmentée mais fertile',
      etat: 'métastable, en attente d’un souffle',
      energie: 'haute densité symbolique',
      glitchFactor: 0.1,
      almaInfluence: 0.5,
      eliInfluence: 0.5,
    },
  };

  const plan: PlanRituel = {
    étapes: [{
      type: 'commande',
      contenu: 'test'
    }],
    complexité: 'simple',
    index: 0,
  };

  // Temporarily override OllamaInterface.query to use our mockFetch
  const originalQuery = OllamaInterface.query;
  OllamaInterface.query = async (prompt: string, model: OllamaModel, _fetch: typeof fetch = mockFetch) =>
  {
    if(callCount === 1)
    {
      assert(model === initialModel, `${ testName }: First call should be to ${ initialModel }`);
    } else if(callCount === 2)
    {
      assert(model === correctionModel, `${ testName }: Second call should be to ${ correctionModel } for correction`);
    }
    return originalQuery.call(OllamaInterface, prompt, model, _fetch);
  };

  const result = await handleCommande({
    type: 'commande',
    contenu: 'test_command'
  }, context, plan);

  assert(result.remediationResults !== undefined, `${ testName }: Remediation results should be present`);
  assert(result.remediationError === undefined, `${ testName }: No remediation error after correction`);

  // Restore original OllamaInterface.query
  OllamaInterface.query = originalQuery;

  console.log(`\n--- Custom Unit Tests for Ollama Auto-Correction: ${ testName } Passed ---\n`);
}

async function runAllTests()
{
  console.log("\n--- Running All Custom Unit Tests ---");

  const models = Object.values(OllamaModel);

  for(const initialModel of models)
  {
    // Test scenario: initialModel generates invalid JSON, Mistral corrects it
    await runOllamaAutoCorrectionTests(
      `Scenario: ${ initialModel } (initial) -> Mistral (correction)`,
      initialModel,
      OllamaModel.Mistral
    );

    // Test scenario: initialModel generates invalid JSON, initialModel corrects it (if it can)
    await runOllamaAutoCorrectionTests(
      `Scenario: ${ initialModel } (initial) -> ${ initialModel } (correction)`,
      initialModel,
      initialModel
    );
  }

  console.log("\n--- All Custom Unit Tests Completed ---");
}

runAllTests().catch(error =>
{
  console.error("An error occurred during testing:", error);
  process.exit(1);
});
