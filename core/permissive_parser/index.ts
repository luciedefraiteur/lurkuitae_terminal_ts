import { Tokenizer } from './tokenizer.js';
import { Parser } from './parser.js';

export const parse = (text: string): any => {
  try {
    const tokens = Tokenizer.tokenize(text);
    const parser = new Parser(tokens);
    const result = parser.parse();
    return result;
  } catch (ex: any) {
    if (typeof ex.type === 'number') {
      throw ex;
    } else {
      throw ex;
    }
  }
};
