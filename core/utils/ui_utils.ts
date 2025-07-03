// ANSI escape codes for colors
export const Colors = {
  Reset: "\x1b[0m",
  Bright: "\x1b[1m",
  Dim: "\x1b[2m",
  Underscore: "\x1b[4m",
  Blink: "\x1b[5m",
  Reverse: "\x1b[7m",
  Hidden: "\x1b[8m",

  FgBlack: "\x1b[30m",
  FgRed: "\x1b[31m",
  FgGreen: "\x1b[32m",
  FgYellow: "\x1b[33m",
  FgBlue: "\x1b[34m",
  FgMagenta: "\x1b[35m",
  FgCyan: "\x1b[36m",
  FgWhite: "\x1b[37m",

  BgBlack: "\x1b[40m",
  BgRed: "\x1b[41m",
  BgGreen: "\x1b[42m",
  BgYellow: "\x1b[43m",
  BgBlue: "\x1b[44m",
  BgMagenta: "\x1b[45m",
  BgCyan: "\x1b[46m",
  BgWhite: "\x1b[47m"
};

export function colorize(text: string, color: string): string
{
  return `${ color }${ text }${ Colors.Reset }`;
}

function formatBox(title: string, content: string, color: string): string
{
  const lines = content.split('\n');
  const maxLength = Math.max(title.length, ...lines.map(line => line.length));
  const horizontalLine = color + '─'.repeat(maxLength + 2) + Colors.Reset;

  let output = color + '┌' + title.padEnd(maxLength + 1) + '┐' + Colors.Reset + '\n';
  lines.forEach(line =>
  {
    output += color + '│ ' + line.padEnd(maxLength) + ' │' + Colors.Reset + '\n';
  });
  output += horizontalLine.replace(/┌/g, '└').replace(/┐/g, '┘');

  return output;
}

export function displayRitualStepResult(res: any): void
{
  const {étape, index, output, analysis, waited, text, success, exitCode, stderr} = res;
  const title = `Étape ${ index + 1 }: ${ étape.type }`;

  switch(étape.type)
  {
    case 'commande':
      if(success)
      {
        console.log(formatBox(`✅ ${ title }`, `Commande: ${ étape.contenu }\n---\n${ output }`, Colors.FgGreen));
      } else
      {
        console.log(formatBox(`❌ ${ title }`, `Commande: ${ étape.contenu }\n---\nCode: ${ exitCode }\nErreur: ${ stderr || output }`, Colors.FgRed));
      }
      break;
    case 'analyse':
      console.log(formatBox(`🧠 ${ title }`, analysis, Colors.FgMagenta));
      break;
    case 'attente':
      console.log(formatBox(`⏳ ${ title }`, res.waitMessage || étape.contenu, Colors.FgBlue));
      break;
    case 'dialogue':
    case 'réponse':
      console.log(formatBox(`💬 ${ title }`, text, Colors.FgWhite));
      break;
    default:
      console.log(formatBox(`- ${ title }`, JSON.stringify(res, null, 2), Colors.FgYellow));
      break;
  }
}

export function demonstrateCursorControl(): void
{
  if(!process.stdout.isTTY)
  {
    console.log("[DEMO CURSEUR] Non-TTY, démo annulée.");
    return;
  }
  // Clear the screen to make the demo clear
  process.stdout.write('\x1b[2J\x1b[0f'); // Clear screen and move cursor to 0,0

  console.log('--- Démonstration du Contrôle du Curseur ---');
  console.log('Ceci est la ligne 1.');
  console.log('Ceci est la ligne 2.');

  // Move cursor to row 1, column 5 (0-indexed)
  process.stdout.cursorTo(5, 0);
  process.stdout.write(Colors.FgGreen + 'ICI' + Colors.Reset);

  // Move cursor to row 2, column 10
  process.stdout.cursorTo(10, 1);
  process.stdout.write(Colors.FgYellow + 'LÀ' + Colors.Reset);

  // Move cursor to a new line below the demo
  process.stdout.cursorTo(0, 8); // Move to row 8, column 0
  console.log('--- Fin de la Démonstration ---');
  console.log('Le Terminal reprend son cours normal...');
}

let cursorInterval: NodeJS.Timeout | null = null;
let cursorState = true;

export function startCursorAnimation()
{
  if(cursorInterval || !process.stdout.isTTY) return;

  process.stdout.write(' '); // Initial space to prevent overwriting
  cursorInterval = setInterval(() =>
  {
    process.stdout.write(Colors.Reset + (cursorState ? Colors.FgCyan + '█' : ' ') + Colors.Reset);
    process.stdout.cursorTo(process.stdout.columns - 1);
    cursorState = !cursorState;
  }, 500);
}

export function stopCursorAnimation()
{
  if(cursorInterval && process.stdout.isTTY)
  {
    clearInterval(cursorInterval);
    cursorInterval = null;
    process.stdout.write(' '); // Clear cursor
    process.stdout.cursorTo(process.stdout.columns - 1);
  }
}