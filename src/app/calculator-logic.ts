export class CalculatorInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CalculatorInputError';
  }
}

type Token =
  | { type: 'number'; value: number }
  | { type: 'operator'; value: '+' | '-' | '*' | '/' }
  | { type: 'leftParen' }
  | { type: 'rightParen' };

const MAX_EXPRESSION_LENGTH = 160;

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let cursor = 0;

  while (cursor < input.length) {
    const character = input[cursor] ?? '';

    if (/\s/.test(character)) {
      cursor += 1;
      continue;
    }

    if (/[0-9.]/.test(character)) {
      const start = cursor;
      let digits = 0;

      while (/[0-9]/.test(input[cursor] ?? '')) {
        cursor += 1;
        digits += 1;
      }

      if (input[cursor] === '.') {
        cursor += 1;

        while (/[0-9]/.test(input[cursor] ?? '')) {
          cursor += 1;
          digits += 1;
        }
      }

      if (digits === 0) {
        throw new CalculatorInputError('Enter a valid number.');
      }

      if (input[cursor] === 'e' || input[cursor] === 'E') {
        cursor += 1;

        if (input[cursor] === '+' || input[cursor] === '-') {
          cursor += 1;
        }

        const exponentStart = cursor;

        while (/[0-9]/.test(input[cursor] ?? '')) {
          cursor += 1;
        }

        if (cursor === exponentStart) {
          throw new CalculatorInputError('Enter a valid number.');
        }
      }

      const value = Number(input.slice(start, cursor));

      if (!Number.isFinite(value)) {
        throw new CalculatorInputError('That number is outside the supported range.');
      }

      tokens.push({ type: 'number', value });
      continue;
    }

    if (character === '+' || character === '-' || character === '*' || character === '/') {
      tokens.push({ type: 'operator', value: character });
      cursor += 1;
      continue;
    }

    if (character === '(') {
      tokens.push({ type: 'leftParen' });
      cursor += 1;
      continue;
    }

    if (character === ')') {
      tokens.push({ type: 'rightParen' });
      cursor += 1;
      continue;
    }

    throw new CalculatorInputError('Use numbers and the basic arithmetic keys only.');
  }

  return tokens;
}

export function calculateExpression(input: string): number {
  if (input.length > MAX_EXPRESSION_LENGTH) {
    throw new CalculatorInputError('This expression is too long. Clear it and try a shorter one.');
  }

  const tokens = tokenize(input);

  if (tokens.length === 0) {
    throw new CalculatorInputError('Enter a calculation first.');
  }

  let cursor = 0;

  function parseExpression(): number {
    let value = parseTerm();

    while (tokens[cursor]?.type === 'operator') {
      const operator = tokens[cursor];

      if (
        !operator ||
        operator.type !== 'operator' ||
        (operator.value !== '+' && operator.value !== '-')
      ) {
        break;
      }

      cursor += 1;
      const right = parseTerm();
      value = operator.value === '+' ? value + right : value - right;
      ensureFinite(value);
    }

    return value;
  }

  function parseTerm(): number {
    let value = parseUnary();

    while (tokens[cursor]?.type === 'operator') {
      const operator = tokens[cursor];

      if (
        !operator ||
        operator.type !== 'operator' ||
        (operator.value !== '*' && operator.value !== '/')
      ) {
        break;
      }

      cursor += 1;
      const right = parseUnary();

      if (operator.value === '/' && right === 0) {
        throw new CalculatorInputError('Cannot divide by zero. Edit the expression and try again.');
      }

      value = operator.value === '*' ? value * right : value / right;
      ensureFinite(value);
    }

    return value;
  }

  function parseUnary(): number {
    const token = tokens[cursor];

    if (token?.type === 'operator' && (token.value === '+' || token.value === '-')) {
      cursor += 1;
      const value = parseUnary();
      return token.value === '-' ? -value : value;
    }

    return parsePrimary();
  }

  function parsePrimary(): number {
    const token = tokens[cursor];

    if (!token) {
      throw new CalculatorInputError('Complete the expression before calculating.');
    }

    if (token.type === 'number') {
      cursor += 1;
      return token.value;
    }

    if (token.type === 'leftParen') {
      cursor += 1;
      const value = parseExpression();

      if (tokens[cursor]?.type !== 'rightParen') {
        throw new CalculatorInputError('Close the parenthesis before calculating.');
      }

      cursor += 1;
      return value;
    }

    throw new CalculatorInputError('Enter a number or a grouped expression.');
  }

  const result = parseExpression();

  if (cursor < tokens.length) {
    throw new CalculatorInputError('Check the expression and try again.');
  }

  return ensureFinite(result);
}

function ensureFinite(value: number): number {
  if (!Number.isFinite(value)) {
    throw new CalculatorInputError('That result is outside the supported number range.');
  }

  return value;
}

export function formatResult(value: number): string {
  if (!Number.isFinite(value)) {
    throw new CalculatorInputError('That result is outside the supported number range.');
  }

  const normalized = Object.is(value, -0) ? 0 : Number(value.toPrecision(12));

  return new Intl.NumberFormat('en-US', {
    maximumSignificantDigits: 12,
  }).format(normalized);
}
