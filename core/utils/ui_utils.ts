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

export function displayRitualStepResult(res: any): void {
  const { étape, index, output, analysis, waited, text } = res;

  console.log(colorize(`
→ Étape ${ index + 1 } : ${ étape.type }`, Colors.FgCyan));
  if (étape.type === 'commande') {
    console.log(colorize(`Exécution : ${ étape.contenu }`, Colors.FgYellow));
    if (res.success) {
      console.log(colorize(`→ Résultat:
${ output }`, Colors.FgGreen));
    } else {
      console.log(colorize(`→ Échec (Code: ${ res.exitCode }) :
${ res.stderr || res.output }`, Colors.FgRed));
    }
  }

  if (étape.type === 'analyse' && analysis) {
    console.log(colorize(`→ Analyse : ${ analysis }`, Colors.FgMagenta));
  }

  if (étape.type === 'attente' && waited) {
    console.log(colorize(`⏳ Attente ${ waited } ms : ${ étape.contenu }`, Colors.FgBlue));
  }

  if (['dialogue', 'réponse'].includes(étape.type) && text) {
    console.log(`💬 ${ text }`); // Default color (white)
  }

  // Handle sub-ritual results if any (from question type)
  if (res.subResultats) {
    for (const subRes of res.subResultats) {
      console.log(colorize(`→ ${ subRes.étape.type } (${ subRes.index }) → ${ subRes.output || subRes.analysis || subRes.text || '' }`, Colors.FgGreen));
    }
  }
}

export function demonstrateCursorControl(): void {
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

export function startCursorAnimation() {
  if (cursorInterval) return;

  process.stdout.write(' '); // Initial space to prevent overwriting
  cursorInterval = setInterval(() => {
    process.stdout.write(Colors.Reset + (cursorState ? Colors.FgCyan + '█' : ' ') + Colors.Reset);
    process.stdout.cursorTo(process.stdout.columns - 1);
    cursorState = !cursorState;
  }, 500);
}

export function stopCursorAnimation() {
  if (cursorInterval) {
    clearInterval(cursorInterval);
    cursorInterval = null;
    process.stdout.write(' '); // Clear cursor
    process.stdout.cursorTo(process.stdout.columns - 1);
  }
}