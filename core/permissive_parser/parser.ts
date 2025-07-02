import { Tokenizer } from './tokenizer.js';
import { TokenType, Token } from './types.js';

export class Parser {
  private tokens: Token[];
  private index: number;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.index = 0;
  }

  peek(): Token | undefined {
    return this.tokens[this.index];
  }

  next(): Token | undefined {
    return this.tokens[this.index++];
  }

  back(): void {
    this.index = Math.max(0, this.index - 1);
  }

  parse(): any {
    const tkn = this.next();

    if (!tkn) {
      this.fail("Unexpected end of input", this.index);
    }

    switch (tkn.type) {
      case Tokenizer.OBJ_OPEN:
        return this.parseObject();
      case Tokenizer.ARR_OPEN:
        return this.parseArray();
      case Tokenizer.STRING:
      case Tokenizer.NUMBER:
      case Tokenizer.SPECIAL:
        return tkn.value;
      default:
        this.back();
        this.fail(tkn);
    }
  }

  parseArray(): any[] {
    const start = this.index;
    const arr: any[] = [];
    let tkn: Token | undefined;

    while (undefined !== (tkn = this.peek())) {
      if (tkn.type === Tokenizer.ARR_CLOSE) {
        this.next();
        return arr;
      }
      arr.push(this.parse());
    }
    this.fail("Opening bracket at position " + start + " has no corresponding closing one!", start);
    return arr; // Should not be reached
  }

  parseObject(): { [key: string]: any } {
    const start = this.index;
    const obj: { [key: string]: any } = {};
    let tkn: Token | undefined;
    let key: any;
    let val: any;
    let indexForMissingKey = 0;

    while (undefined !== (tkn = this.peek())) {
      if (tkn.type === Tokenizer.OBJ_CLOSE) {
        this.next();
        return obj;
      }
      key = this.parse();
      tkn = this.peek();
      if (tkn && tkn.type === Tokenizer.OBJ_CLOSE) {
        obj[indexForMissingKey++] = key;
        this.next();
        return obj;
      } else if (tkn && tkn.type === Tokenizer.COLON) {
        this.next();
        val = this.parse();
        obj[key] = val;
      } else {
        // Missing key.
        obj[indexForMissingKey++] = key;
      }
    }
    this.fail("Opening brace at position " + start + " has no corresponding closing one!", start);
    return obj; // Should not be reached
  }

  fail(tkn: Token | string, index?: number): never {
    if (typeof tkn === 'string') {
      throw { message: tkn, index: index };
    }
    throw {
      index: tkn.index,
      message: "Unexpected token " + Tokenizer.getTypeName(tkn.type) + " at position " + tkn.index + "!"
    };
  }
}
