
# nestlang

nestlang is a minimal builder and validator for NestLang — a small,
declarative extraction language for structured scraping and data extraction.

## What this package exports

- `ExampleBuilder`: programmatically build and format example NestLang
  specifications paired with example JSON.
- `ValidateNestLang(text: string)`: lint/validate a NestLang specification and
  return a `{ valid: boolean; errors: string[] }` result.

## Install

```
npm install nestlang
```

## Usage

Import the utilities from the package and use them directly.

Validate a NestLang specification:

```js
import { ValidateNestLang } from "nestlang";

const spec = `
products: the top 10 products (array)
  -name: Product name (string)
  -price: Product price (number)
  -in_stock: Whether the product is in stock (boolean)
`;

const result = ValidateNestLang(spec);

if (!result.valid) {
  for (const err of result.errors) {
    console.error(`[${err.code}] Line ${err.line}: ${err.message}`);
  }
} else {
  console.log("Spec is valid");
}

```
### *Example of a valid `Nestlang`*
Top-level keys can have optional descriptions and types:

```js
products: (array)                                                                      
products: the top 10 products (array).                                                 
metadata: general information about the page (object)
```

Child fields:
- must be indented
- must begin with -

can have descriptions and optional types

```js
products: the top 10 products (array)
  -name: Product name (string)
  -price: Product price (number)
  -rating: Product rating (number)
```

#### Example of an invalid child (caught by validator)

```js
products: (array)
  name: Product name (string)
```
This will produce something like:

```js
"[SYNTAX_ERROR] Line 3: Child fields must begin with '-'".
```

### Build and format examples with `ExampleBuilder`:

```js
import { ExampleBuilder } from "nestlang";

const builder = new ExampleBuilder();

builder.add({
  title: "Product List Example",
  nestlang: `
products: the top 10 products (array)
  -name: Product name (string)
  -price: Product price (number)
`,
  json: {
    products: [{ name: "Sample", price: 9.99 }]
  },
  notes: ["Basic product list example with name and price fields."]
});

const examples = builder.buildAll();

examples.forEach(ex => {
  console.log(ex.string);
});
```

Notes:
- `ExampleBuilder.add(example)` expects an object of shape `{ title, nestlang, json, notes? }`.
- `ExampleBuilder.buildAll()` returns an array of `{ object, string }` entries where `string` is a formatted representation.

## Development

Build and run the included tests:

```bash
npm run build
npm test
```

This project is published as ESM (see `type: module` in `package.json`) and
includes TypeScript type declarations at `dist/index.d.ts`.

## Author & License

Author: Solomon Williams

License: MIT

