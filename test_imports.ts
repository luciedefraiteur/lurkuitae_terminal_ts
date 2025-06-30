export async function main()
{
    try {
        
    console.log("[TEST] Importing handleSystemCommand...");
    const { handleSystemCommand } = await import('./core/system_handler.js');
    console.log("✅ OK handleSystemCommand");

    console.log("[TEST] Importing OllamaInterface...");
    const { OllamaInterface } = await import('./core/ollama_interface.js');
    console.log("✅ OK OllamaInterface");

    console.log("[TEST] Importing generateRitualSequencePrompt...");
    const { generateRitualSequencePrompt } = await import('./core/prompts/generateRitualSequence.js');
    console.log("✅ OK generateRitualSequencePrompt");

    console.log("[TEST] Importing generateAnalysisPrompt...");
    const { generateAnalysisPrompt } = await import('./core/prompts/generateAnalysisPrompt.js');
    console.log("✅ OK generateAnalysisPrompt");

    console.log("[TEST] Importing types...");
    const types = await import('./core/types.js');
    console.log("✅ OK types :", Object.keys(types));

    console.log("🎉 Tous les modules ont été importés avec succès.");
    } catch (err) {
    console.error("💥 Erreur lors d’un import :", err);
    }
}

main();