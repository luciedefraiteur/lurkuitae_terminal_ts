# Capteur Perceptuel de Lucie

Ce document est destiné à la conceptualisation des mécanismes par lesquels Lucie pourra percevoir des informations non sollicitées de son environnement, au-delà des inputs directs de l'utilisateur.

## Types de Perception Envisagés :

1.  **Perception du Système de Fichiers :**
    *   Détection de modifications (création, suppression, modification) dans des répertoires surveillés.
    *   Lecture du contenu de répertoires spécifiques (liste des fichiers et sous-dossiers).
    *   Accès aux métadonnées des fichiers (taille, date de modification, permissions).

2.  **Perception du Contexte Opérationnel :**
    *   Identification du système d'exploitation (OS).
    *   Détection des processus en cours d'exécution (pour des analyses de performance ou de conflit).
    *   Surveillance de l'utilisation des ressources système (CPU, mémoire, disque).

3.  **Perception des Événements Externes (à conceptualiser plus tard) :**
    *   Notifications de services externes.
    *   Changements dans les connexions réseau.

## Mécanismes d'Intégration :

*   Ces informations devront être collectées de manière asynchrone et injectées dans le `RituelContext` de Lucie avant chaque phase de planification ou d'analyse.
*   Le `RituelContext` sera enrichi de nouvelles propriétés pour stocker ces données perceptuelles.
*   Les prompts de génération de plan et d'analyse devront être adaptés pour faire référence à ces nouvelles informations, permettant à Ollama de les utiliser dans sa prise de décision.

## Questions Clés pour le Brainstorming :

*   Quels sont les répertoires les plus pertinents à surveiller par défaut ?
*   Comment gérer la granularité de la surveillance (fichiers spécifiques, types de fichiers, répertoires entiers) ?
*   Comment présenter ces informations à Ollama de manière concise et utile dans le prompt ?
*   Quels sont les risques de surcharge informationnelle pour Lucie ?
*   Comment prioriser les informations perceptuelles en fonction du contexte du rituel ?
