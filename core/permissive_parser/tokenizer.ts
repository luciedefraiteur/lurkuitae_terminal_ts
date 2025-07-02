import { TokenType, Token } from './types.js';

const TYPE_NAMES: string[] = [
  "???",
  "OBJ_OPEN", "OBJ_CLOSE", "ARR_OPEN", "ARR_CLOSE",
  "STRING", "NUMBER", "SPECIAL", "COLON"
];

class Context {
  private source: string;
  private end: number;
  private index: number;
  private tokens: Token[];
  private eaters: Array<() => void>;

  constructor() {
    this.eaters = [
      this.eatBlanks.bind(this),
      this.eatSymbol.bind(this),
      this.eatComment.bind(this),
      this.eatString.bind(this),
      this.eatIdentifier.bind(this)
    ];
    this.source = '';
    this.end = 0;
    this.index = 0;
    this.tokens = [];
  }

  tokenize(source: string): Token[] {
    this.source = source;
    this.end = source.length;
    this.index = 0;
    this.tokens = [];

    let eater: () => void;
    let eaterIndex: number;
    let currentSourceIndex: number;

    while (this.index < this.end) {
      currentSourceIndex = this.index;
      for (eaterIndex = 0; eaterIndex < this.eaters.length; eaterIndex++) {
        eater = this.eaters[eaterIndex];
        eater();
        if (this.index !== currentSourceIndex) break;
      }
      if (this.index === currentSourceIndex) {
        this.fail();
      }
    }

    return this.tokens;
  }

  is(...args: string[]): boolean {
    let arg: string;
    for (let k = 0; k < args.length; k++) {
      arg = args[k];
      if (this.source.substring(this.index, this.index + arg.length) === arg) return true;
    }
    return false;
  }

  fail(msg?: string): never {
    if (typeof msg === 'undefined') msg = "Invalid char at " + this.index + "!";
    throw { index: this.index, source: this.source, message: msg };
  }

  eos(): boolean { return this.index >= this.end; }

  peek(): string | null {
    return this.eos() ? null : this.source[this.index];
  }

  next(): string | null {
    return this.eos() ? null : this.source[this.index++];
  }

  back(): void {
    if (this.index > 0) this.index--;
  }

  addToken(type: TokenType, index?: number, value?: any): void {
    let tokenIndex: number;
    let tokenValue: any;

    if (typeof index === 'undefined') {
      tokenIndex = this.index;
      tokenValue = value;
    } else if (typeof index !== 'number') {
      tokenValue = index;
      tokenIndex = this.index;
    } else {
      tokenIndex = index;
      tokenValue = value;
    }

    this.tokens.push({
      type: type,
      index: tokenIndex,
      value: tokenValue
    });
  }

  private eatBlanks(): void {
    while (" \t\n\r".indexOf(this.peek() || '') !== -1) this.index++;
  }

  private eatSymbol(): void {
    let tkn: TokenType | null = null;
    const c = this.peek();
    switch (c) {
      case '{': tkn = TokenType.OBJ_OPEN; break;
      case '}': tkn = TokenType.OBJ_CLOSE; break;
      case '[': tkn = TokenType.ARR_OPEN; break;
      case ']': tkn = TokenType.ARR_CLOSE; break;
      case ':': tkn = TokenType.COLON; break;
    }
    if (c === ',') {
      this.index++;
      return;
    }
    if (tkn !== null) {
      this.addToken(tkn);
      this.index++;
    }
  }

  private eatComment(): void {
    const savedIndex = this.index;
    if (this.peek() !== '/') return;
    this.index++;
    const c = this.next();
    if (c === '/') {
      const endOfSingleComment = this.source.indexOf('\n', this.index);
      if (endOfSingleComment === -1) {
        this.index = this.end;
      } else {
        this.index = endOfSingleComment + 1;
      }
    } else if (c === '*') {
      const endOfComment = this.source.indexOf('*/', this.index);
      if (endOfComment === -1) {
        this.index = this.end;
      }
      else {
        this.index = endOfComment + 2; // +2 to skip '*/'
      }
    } else {
      this.index = savedIndex;
    }
  }

  private eatString(): void {
    const quote = this.peek();
    if (quote !== '"' && quote !== "'" && quote !== "`") return; // Added backtick
    const start = this.index;
    this.index++;
    let escape = false;
    let str = '';
    let c: string | null;
    while (!this.eos()) {
      c = this.next();
      if (c === null) break; // Should not happen if !this.eos()

      if (escape) {
        escape = false;
        if (c === 'n') c = '\n';
        else if (c === 'r') c = '\r';
        else if (c === 't') c = '\t';
        // Handle escaped backtick if the quote is a backtick
        else if (c === '`' && quote === '`') c = '`';
        str += c;
      } else if (c === "\\") {
        escape = true;
      } else if (c === quote) {
        this.addToken(TokenType.STRING, start, str);
        return;
      } else {
        str += c;
      }
    }
    this.index = start;
    this.fail("Missing end of string");
  }

  private RX_DECIMAL = /^-?(\.[0-9]+|[0-9]+(\.[0-9]+)?)([eE]-?[0-9]+)?$/;
  private RX_HEXA = /^-?0x[0-9a-f]+$/i;
  private RX_OCTAL = /^-?0o[0-7]+$/i;
  private RX_BINARY = /^-?0b[01]+$/i;

  private eatIdentifier(): void {
    const start = this.index;
    let c = this.peek();
    if (c === null || " \t\n\r,:[]{}".indexOf(c) !== -1 || this.is("//", "/*")) return;
    this.index++;
    let str = c;
    while (!this.eos()) {
      c = this.peek();
      if (c === null || " \t\n\r,:[]{}".indexOf(c) !== -1 || this.is("//", "/*")) break;
      str += c;
      this.index++;
    }
    if (this.RX_DECIMAL.test(str)) {
      this.addToken(TokenType.NUMBER, start, parseFloat(str));
    } else if (this.RX_HEXA.test(str)) {
      this.addToken(TokenType.NUMBER, start, parseInt(str, 16));
    } else if (this.RX_OCTAL.test(str)) {
      if (str.charAt(0) === '-') {
        str = "-" + str.substring(3);
      } else {
        str = str.substring(2);
      }
      this.addToken(TokenType.NUMBER, start, parseInt(str, 8));
    } else if (this.RX_BINARY.test(str)) {
      if (str.charAt(0) === '-') {
        str = "-" + str.substring(3);
      } else {
        str = str.substring(2);
      }
      this.addToken(TokenType.NUMBER, start, parseInt(str, 2));
    } else {
      let type = TokenType.SPECIAL;
      let value: any = str;
      if (str === 'null') value = null;
      else if (str === 'undefined') value = undefined;
      else if (str === 'true') value = true;
      else if (str === 'false') value = false;
      else type = TokenType.STRING;
      this.addToken(type, start, value);
    }
  }
}

export const Tokenizer = {
  OBJ_OPEN: TokenType.OBJ_OPEN,
  OBJ_CLOSE: TokenType.OBJ_CLOSE,
  ARR_OPEN: TokenType.ARR_OPEN,
  ARR_CLOSE: TokenType.ARR_CLOSE,
  STRING: TokenType.STRING,
  NUMBER: TokenType.NUMBER,
  SPECIAL: TokenType.SPECIAL,
  COLON: TokenType.COLON,
  tokenize: function(source: string): Token[] {
    const ctx = new Context();
    return ctx.tokenize(source);
  },
  getTypeName: function(type: TokenType): string { return TYPE_NAMES[type]; }
};