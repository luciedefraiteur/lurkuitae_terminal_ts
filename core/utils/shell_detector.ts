import os from 'os';
import path from 'path';

export type ShellType = 'powershell' | 'cmd' | 'other';

/**
 * Détecte le type de shell actuel sur Windows.
 * @returns {ShellType} Le type de shell détecté.
 */
export function detectWindowsShell(): ShellType
{
  if(os.platform() !== 'win32')
  {
    return 'other';
  }

  const shellPath = process.env.ComSpec || process.env.SHELL || '';
  const parentProcess = process.env.__PSLockdownPolicy ? 'powershell' : '';

  const lowerShell = shellPath.toLowerCase();

  if(
    lowerShell.includes('powershell.exe') ||
    lowerShell.includes('pwsh.exe') ||
    parentProcess === 'powershell'
  )
  {
    return 'powershell';
  }

  if(lowerShell.includes('cmd.exe'))
  {
    return 'cmd';
  }

  return 'other';
}