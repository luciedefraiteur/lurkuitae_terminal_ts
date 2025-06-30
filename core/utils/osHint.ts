const isWindows = process.platform === 'win32';
export enum OSContext
{
    Windows = "(Contexte : Windows, cmd)",
    Unix = "(Contexte : Linux ou Unix-like, shell POSIX)"
}
export const osHint = isWindows
    ? OSContext.Windows
    : OSContext.Unix;

