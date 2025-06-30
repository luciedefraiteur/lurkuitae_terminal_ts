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

  console.log(colorize(`\n→ Étape ${ index + 1 } : ${ étape.type }`, Colors.FgCyan));
  if (étape.type === 'commande') {
    console.log(colorize(`Exécution : ${ étape.contenu }`, Colors.FgYellow));
    if (res.success) {
      console.log(colorize(`→ Résultat:\n${ output }`, Colors.FgGreen));
    } else {
      console.log(colorize(`→ Échec (Code: ${ res.exitCode }) :\n${ res.stderr || res.output }`, Colors.FgRed));
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