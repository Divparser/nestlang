export type NestLangErrorCode =
  | "SYNTAX_ERROR"
  | "INVALID_TYPE"
  | "INDENTATION_ERROR";

export type NestLangError = {
  code: NestLangErrorCode;
  message: string;
  line: number;
};

export type NestLangValidationResult = {
  valid: boolean;
  errors: NestLangError[];
};

const allowedTypes = ["string", "number", "boolean", "object", "array", "Date"];

export function ValidateNestLang(text: string): NestLangValidationResult {
  const errors: NestLangError[] = [];
  const lines = text.split("\n").filter(l => l.trim().length > 0);

  const stack: Array<{ indent: number }> = [];

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const indent = rawLine.match(/^\s*/)?.[0].length ?? 0;
    const line = rawLine.trim();

    // -----------------------------------------
    // TOP-LEVEL KEY ONLY (indent === 0)
    // Supports: key: description (type)
    // -----------------------------------------
    if (indent === 0 && !line.startsWith("-") && line.includes(":")) {
      const match = line.match(/^([a-zA-Z0-9_]+):\s*(.*?)(?:\s*\((.*?)\))?$/);

      if (!match) {
        errors.push({
          code: "SYNTAX_ERROR",
          message: `Invalid key syntax.`,
          line: lineNumber
        });
        return;
      }

      const [, key, _description, rawType] = match;
      const type = rawType || "string";

      if (!allowedTypes.includes(type)) {
        errors.push({
          code: "INVALID_TYPE",
          message: `Invalid type '${type}' for key '${key}'.`,
          line: lineNumber
        });
      }

      while (stack.length && stack[stack.length - 1]!.indent >= indent) {
        stack.pop();
      }

      stack.push({ indent });
      return;
    }

    // -----------------------------------------
    // CHILD FIELD MUST BEGIN WITH "-"
    // Any indented line that doesn't start with "-"
    // -----------------------------------------
    if (indent > 0 && !line.startsWith("-")) {
      errors.push({
        code: "SYNTAX_ERROR",
        message: `Child fields must begin with '-'.`,
        line: lineNumber
      });
      return;
    }

    // -----------------------------------------
    // CHILD FIELD: -key: description (type)
    // -----------------------------------------
    if (line.startsWith("-")) {
      const match = line.match(/^-([a-zA-Z0-9_]+):\s*(.*?)(?:\s*\((.*?)\))?$/);

      if (!match) {
        errors.push({
          code: "SYNTAX_ERROR",
          message: `Invalid child field syntax.`,
          line: lineNumber
        });
        return;
      }

      const [, key, description, rawType] = match;
      const type = rawType || "string";

      if (!allowedTypes.includes(type)) {
        errors.push({
          code: "INVALID_TYPE",
          message: `Invalid type '${type}' for field '${key}'.`,
          line: lineNumber
        });
      }

      if (!description || description.length < 1) {
        errors.push({
          code: "SYNTAX_ERROR",
          message: `Description missing for field '${key}'.`,
          line: lineNumber
        });
      }

      while (stack.length && stack[stack.length - 1]!.indent >= indent) {
        stack.pop();
      }

      stack.push({ indent });
      return;
    }

    // -----------------------------------------
    // ANYTHING ELSE IS INVALID
    // -----------------------------------------
    errors.push({
      code: "SYNTAX_ERROR",
      message: `Invalid NestLang syntax.`,
      line: lineNumber
    });
  });

  return {
    valid: errors.length === 0,
    errors
  };
}
