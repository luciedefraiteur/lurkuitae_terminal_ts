const isWindows = process.platform === 'win32';
export const osHint = isWindows
    ? "(Contexte : Windows, cmd ou PowerShell)"
    : "(Contexte : Linux ou Unix-like, shell POSIX)";

