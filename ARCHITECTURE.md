# Project Architecture: LURKUITAE

This document outlines the architecture of the LURKUITAE project, a command-line interface that interprets natural language commands through a "ritualistic" process, guided by a Large Language Model (LLM).

## 1. High-Level Architectural Diagram

This diagram illustrates the primary components and the flow of information between them.

```mermaid
graph TD
    subgraph User Interaction
        A[main.ts] --> B(runTerminalRituel);
        B -- asks for input --> User;
        User -- provides command --> B;
    end

    subgraph Core Ritual Engine
        B -- user command --> C{generateRituel};
        C -- constructs prompt --> D[generateRitualSequence.ts];
        D -- sends prompt --> E[OllamaInterface];
        E -- queries --> F(Ollama LLM);
        F -- returns JSON plan --> E;
        E -- returns JSON plan --> C;
        C -- parses JSON --> G[Permissive Parser];
        G -- returns structured plan --> C;
        C -- returns PlanRituel --> B;
        B -- executes plan --> H{executeRituelPlan};
    end

    subgraph Plan Execution
        H -- iterates through steps --> I[ritual_step_handlers.ts];
        I -- handles command --> J[system_handler.ts];
        J -- executes on OS --> K[Terminal];
        K -- returns output/error --> J;
        J -- returns result --> I;
        I -- returns result --> H;
    end

    subgraph State & Context
        L(RituelContext) <--> B;
        L <--> C;
        L <--> H;
        L <--> I;
    end

    subgraph Self-Correction Loop
        I -- on 'analyse' step --> C;
        C -- generates new plan --> B;
    end

    style User fill:#f9f,stroke:#333,stroke-width:2px
    style Core Ritual Engine fill:#ccf,stroke:#333,stroke-width:2px
    style Plan Execution fill:#cfc,stroke:#333,stroke-width:2px
    style State & Context fill:#ffc,stroke:#333,stroke-width:2px
    style Self-Correction Loop fill:#fcc,stroke:#333,stroke-width:2px
```

## 2. Core Components

*   **`main.ts`**: The application's entry point. It handles initialization, parses command-line arguments (like selecting the LLM model), and kicks off the main interactive loop by calling `runTerminalRituel`.

*   **`run_terminal_rituel.ts`**: This is the heart of the application. It manages the main recursive loop that prompts the user, generates a plan, executes it, and then repeats the process. It also contains the logic for the special "Chant Mode".

*   **`ritual_utils.ts`**: A key utility file containing:
    *   `getContexteInitial()`: Creates the initial state object (`RituelContext`).
    *   `generateRituel()`: The core planning function. It orchestrates the creation of a prompt, queries the LLM, and parses the response into an executable `PlanRituel`.
    *   `executeRituelPlan()`: The plan executor. It iterates over the steps of a `PlanRituel` and uses a `switch` statement to delegate each step to the appropriate handler.

*   **`ritual_step_handlers.ts`**: This file implements the logic for every possible action (`Étape`) the agent can take, such as changing directories, executing commands, asking the user questions, or analyzing the output of a previous command.

*   **`ollama_interface.ts`**: This module abstracts all communication with the Ollama LLM. It handles the API requests, manages OS-specific differences (Windows vs. Unix), and cleans the raw output from the model.

*   **`permissive_parser/`**: A critical component for robustness. This custom JSON parser is designed to handle incomplete or slightly malformed JSON, which can often be returned by LLMs. This prevents the application from crashing and allows for retry mechanisms.

*   **`prompts/`**: This directory contains the logic for generating the complex prompts sent to the LLM. `generateRitualSequence.ts` is particularly important, as it dynamically assembles various pieces of context to guide the LLM in generating a valid and relevant plan.

*   **`types.ts`**: Defines the data structures and "contracts" used throughout the application, ensuring consistency. The most important types are `Étape`, `PlanRituel`, and `RituelContext`.

## 3. The "Ritual" Execution Flow

The application operates in a clear, cyclical process:

1.  **Input**: The `runTerminalRituel` function prompts the user for a command.
2.  **Plan Generation**: The user's input is sent to `generateRituel`. This function uses `generateRitualSequencePrompt` to build a detailed prompt, including the user's request, the current context (working directory, history), and OS-specific examples.
3.  **LLM Query**: `OllamaInterface` sends the prompt to the specified Ollama model.
4.  **Parsing**: The LLM's response (which should be JSON) is parsed by the `permissive_parser`. If parsing fails, the system can retry.
5.  **Plan Execution**: The resulting `PlanRituel` object is passed to `executeRituelPlan`.
6.  **Step Handling**: `executeRituelPlan` loops through each `Étape` in the plan and calls the corresponding function from `ritual_step_handlers.ts` to perform the action.
7.  **State Update**: The `RituelContext` is updated with the results of each step (command output, directory changes, etc.).
8.  **Loop**: The cycle repeats.

## 4. Unique & Noteworthy Features

*   **Thematic Depth**: The project is infused with a unique poetic and mythological theme (`LucieDefraiteur`, "rituals", "chants"). This is not just flavor text; it's embedded in the prompts and data structures, directly influencing the AI's behavior and responses.
*   **Dynamic Self-Correction**: The `analyse` step is a powerful feature. It allows the AI to execute a command, analyze its own output, and then *generate a new plan* based on that analysis. This creates a feedback loop that enables more complex and adaptive problem-solving.
*   **Error Remediation**: When a command fails, the system doesn't just give up. It generates a specific prompt (`generateErrorRemediationPrompt`) to ask the LLM to create a *new plan to fix the error*.
*   **Robustness**: The combination of the permissive parser and explicit retry logic for plan generation makes the system resilient to common LLM failures (like invalid JSON).
*   **Context-Aware Prompts**: The prompts are highly contextual, incorporating system temperature, OS, previous plans, and the "personality" of Lucie, leading to more tailored and effective plan generation.