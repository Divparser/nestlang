export type NestLangExample = {
  title: string;
  nestlang: string;
  json: any;
  notes?: string[];
};

export class ExampleBuilder {
  private examples: NestLangExample[] = [];

  add(example: NestLangExample) {
    this.examples.push(example);
    return this; // allow chaining
  }

  buildAll() {
    return this.examples.map(ex => this.build(ex));
  }

  build(example: NestLangExample) {
    return {
      object: example,
      string: this.formatString(example)
    };
  }

  private formatString(example: NestLangExample): string {
    const notes =
      example.notes && example.notes.length > 0
        ? "Notes:\n" + example.notes.map(n => `- ${n}`).join("\n")
        : "";

    return `\n### ${example.title}\n\n${example.nestlang.trim()}\n${JSON.stringify(example.json, null, 2)}\n\n${notes}
    `.trim();
  }
}
