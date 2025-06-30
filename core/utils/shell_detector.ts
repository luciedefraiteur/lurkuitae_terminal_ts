import os from 'os';

export type ShellType = 'powershell' | 'cmd' | 'other';

/**
 * Détecte le type de shell actuel sur Windows.
 * @returns {ShellType} Le type de shell détecté.
 */
export function detectWindowsShell(): ShellType {
  if (os.platform() !== 'win32') {
    return 'other';
  }

  // Vérifier la variable d'environnement PSModulePath pour détecter PowerShell
  if (process.env.PSModulePath) {
    return 'powershell';
  }

  // Si ce n'est pas PowerShell, on suppose que c'est CMD par défaut sur Windows
  // Une détection plus robuste pourrait impliquer de vérifier le nom du processus parent,
  // mais cela peut être complexe et moins fiable.
  return 'cmd';
}
