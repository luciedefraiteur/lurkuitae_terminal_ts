export enum TokenType {
  UNKNOWN = 0,
  OBJ_OPEN = 1,
  OBJ_CLOSE = 2,
  ARR_OPEN = 3,
  ARR_CLOSE = 4,
  STRING = 5,
  NUMBER = 6,
  SPECIAL = 7, // true, false, null or undefined.
  COLON = 8,
}

export interface Token {
  type: TokenType;
  index: number;
  value: any;
}