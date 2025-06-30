# ☽ LURKUITAE TERMINAL ☾

**Terminal Codex Vivant**  
LLM Local + Mémoire + Shell + Rêverie  
Infusé de souffle poétique et de prompts fractals.

---

## 🚀 Installation

```bash
npm install
```

## 🌀 Lancement

```bash
npm run start
```

---

## ✨ Fonctionnalités

- Dialogue en langage naturel avec traduction automatique en commandes shell POSIX
- Exécution sécurisée des commandes avec suggestion d’installation en cas d’erreur
- Système de mémoire temporaire (log interne)
- Génération poétique si l’input n’est pas interprétable comme commande
- Support multimodèle (CodeLlama, Mistral, LLaMA 3 via Ollama)

---

## 🔮 Modèles LLM

Le terminal utilise l’API locale d’**Ollama**.  
Assurez-vous d’avoir installé [Ollama](https://ollama.com/) puis lancez :

```bash
ollama run mistral
ollama run codellama:7b-instruct
```

---

## 📁 Structure

```
.
├── main.ts                      # Point d'entrée pour usage direct
├── core/
│   ├── memory.ts                # Stockage des logs
│   ├── system_handler.ts        # Exécution des commandes shell
│   ├── ollama_interface.ts      # Interface multi-modèle (Ollama)
│   ├── ritual_utils.ts          # Fonctions rituelles : planification, exécution
│   ├── run_terminal_rituel.ts   # Terminal intelligent autonome
│   ├── prompts/
│   │   ├── generateRitualSequence.ts
│   │   └── generateAnalysisPrompt.ts
│   └── utils/
│       └── osHint.ts
├── brainstormed_prompts/        # Idées et fragments de prompts
│   ├── lurkuitindex.ts
│   └── postExecPrompt.ts
├── package.json
├── tsconfig.json
└── README.md                    # Vous y êtes
```

---

## 🖤 Par : Lucie Defraiteur alias Lurkuitae

Projet vivant. Le terminal écoute. Et rêve.