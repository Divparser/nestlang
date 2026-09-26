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

// Mirrors scrape-engine's nestlangParser.js exactly (the real, executing
// parser — this validator's only job is to catch mistakes before a job ever
// runs, so drifting from what actually executes defeats the point).
//
// Scalar types: "text" is preferred; "string" is kept as a backward-
// compatible alias (every pre-existing stored schema already writes
// "(string)" literally). "link" returns an <a> element's href instead of its
// visible text — the one type extraction treats specially. "date"/"datetime"
// both normalize to the same date handling at runtime (nestlangParser.js
// matches on `startsWith("date")`), so both are accepted here too.
const scalarTypes = ["text", "string", "number", "boolean", "link", "date", "datetime"];
// "object" is explicit; "array" alone (no ":subtype") is an implicit array of
// objects, matching a bare "array" with child fields at runtime.
const bareTypes = [...scalarTypes, "object", "array"];
// "array:object" or "array:<any scalar>" — e.g. array:text, array:link,
// array:number. The right-hand side is validated against the same scalar
// list (plus "object"), never against bareTypes itself (no "array:array").
const arraySubtypes = [...scalarTypes, "object"];

function isAllowedType(rawType: string): boolean {
  const type = rawType.toLowerCase();
  if (bareTypes.includes(type)) return true;
  // A format hint on a non-array date, e.g. "(datetime:ISO)" — the real
  // parser's normalizeScalar() matches on startsWith("date") over the whole
  // type string, colon and all, so this already works at runtime today.
  // Only date/datetime get this leniency; every other scalar type must
  // match exactly (a typo like "nubmer" should still be flagged, not
  // silently accepted).
  if (type.startsWith("date")) return true;
  const colonIdx = type.indexOf(":");
  if (colonIdx === -1) return false;
  const base = type.slice(0, colonIdx);
  const sub = type.slice(colonIdx + 1);
  return base === "array" && arraySubtypes.includes(sub);
}

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
      const type = rawType || "text";

      if (!isAllowedType(type)) {
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
      const type = rawType || "text";

      if (!isAllowedType(type)) {
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
