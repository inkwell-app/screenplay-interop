import { createHash } from "node:crypto"
import { lstatSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { Ajv2020 } from "ajv/dist/2020.js"
import { XMLValidator } from "fast-xml-parser"

export const ORIGINAL_FICTION =
  "This fixture is original fiction. It is not derived from a titled produced or published screenplay."

export interface Portability {
  id: string
  classification: string
  title: string
  detail?: string
  count?: number
}

export interface Expectation {
  fixtureId: string
  format: "fountain" | "fdx"
  writerBehavior: string
  health?: string
  portability: Portability[]
  counts?: Record<string, number>
  nameVariants?: {
    kind: "character" | "location"
    canonicalHint: string
    variants: { value: string; count: number }[]
  }[]
}

export interface Fixture {
  id: string
  input: string
  inputSha256: string
  expectation: Expectation
}

function fileText(path: string): string {
  if (!lstatSync(path).isFile()) throw new Error(`Expected a regular file: ${path}`)
  const text = readFileSync(path, "utf8")
  if (!text.trim()) throw new Error(`Empty file: ${path}`)
  return text
}

function readJson(path: string): unknown {
  try {
    return JSON.parse(fileText(path))
  } catch (error) {
    throw new Error(`Cannot read JSON at ${path}`, { cause: error })
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readSchema(path: string): Record<string, unknown> {
  const schema = readJson(path)
  if (!isObject(schema)) throw new Error(`Expected an object schema: ${path}`)
  return schema
}

function duplicate(values: readonly string[]): boolean {
  return new Set(values).size !== values.length
}

/** Read the files and validate their declared expectations; no application is executed. */
export function loadFixtures(root: string): Fixture[] {
  const ajv = new Ajv2020({ allErrors: true, strict: true })
  const validateExpected = ajv.compile<Expectation>(
    readSchema(join(root, "schemas/expected.schema.json")),
  )
  const validateDescriptor = ajv.compile(readSchema(join(root, "schemas/fixture.schema.json")))
  const fixturesRoot = join(root, "fixtures")
  const entries = readdirSync(fixturesRoot, { withFileTypes: true }).sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
  )
  if (entries.length === 0) throw new Error("The fixture collection is empty")
  const fixtures: Fixture[] = []
  const classes = new Set<string>()
  for (const entry of entries) {
    if (!entry.isDirectory()) throw new Error(`Expected fixture directory: ${entry.name}`)
    const directory = join(fixturesRoot, entry.name)
    const expectation = readJson(join(directory, "expected.json"))
    if (!validateExpected(expectation)) {
      throw new Error(
        `${entry.name}: invalid expectations: ${ajv.errorsText(validateExpected.errors)}`,
      )
    }
    if (expectation.fixtureId !== entry.name) {
      throw new Error(`${entry.name}: fixtureId does not match directory`)
    }
    const inputs = readdirSync(directory).filter((file) => file.startsWith("input."))
    if (inputs.length !== 1) throw new Error(`${entry.name}: expected exactly one input file`)
    const inputName = inputs[0]
    if (!inputName) throw new Error(`${entry.name}: missing input file`)
    const descriptor = {
      id: entry.name,
      format: expectation.format,
      files: {
        readme: "README.md",
        input: inputName,
        expected: "expected.json",
        copyright: "copyright.md",
      },
    }
    if (!validateDescriptor(descriptor)) {
      throw new Error(
        `${entry.name}: invalid directory: ${ajv.errorsText(validateDescriptor.errors)}`,
      )
    }
    fileText(join(directory, "README.md"))
    if (!fileText(join(directory, "copyright.md")).includes(ORIGINAL_FICTION)) {
      throw new Error(`${entry.name}: missing original-fiction declaration`)
    }
    const inputPath = join(directory, inputName)
    const input = fileText(inputPath)
    if (
      expectation.format === "fdx" &&
      (expectation.health === "readable" || expectation.health === "readable_with_warnings")
    ) {
      const syntax = XMLValidator.validate(input)
      if (syntax !== true)
        throw new Error(
          `${entry.name}: expected readable FDX contains invalid XML: ${syntax.err.msg}`,
        )
    }
    if (duplicate(expectation.portability.map((item) => item.id))) {
      throw new Error(`${entry.name}: duplicate portability id`)
    }
    for (const item of expectation.portability) classes.add(item.classification)
    fixtures.push({
      id: entry.name,
      input,
      inputSha256: createHash("sha256").update(readFileSync(inputPath)).digest("hex"),
      expectation,
    })
  }
  // Derive the coverage requirement from the public schema, not a second enum.
  const expectationSchema = validateExpected.schema
  if (typeof expectationSchema !== "object" || expectationSchema === null) {
    throw new Error("Expected an object schema")
  }
  const requiredClasses: unknown =
    expectationSchema.properties?.portability?.items?.properties?.classification?.enum
  if (!Array.isArray(requiredClasses) || requiredClasses.length === 0) {
    throw new Error("Portability schema does not declare classifications")
  }
  for (const classification of requiredClasses) {
    if (typeof classification !== "string" || !classes.has(classification)) {
      throw new Error(`Fixture collection does not cover classification: ${classification}`)
    }
  }
  return fixtures
}

function tableCell(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll(/\r?\n/g, " ")
}

export function compatibilityMarkdown(fixtures: readonly Fixture[]): string {
  const lines = [
    "# Screenplay compatibility test cases",
    "",
    "Use these original screenplay files to test import, export, and round-trip behavior in your tool. Each case describes the feature to inspect and the portability classification to consider.",
    "",
    "The table records fixture expectations. To report an application result, record its version, the fixture commit and input hash, and the observed output from your test run.",
    "",
    "| Case | Format | What to check | File health | Portability expectations |",
    "| --- | --- | --- | --- | --- |",
  ]
  for (const fixture of fixtures) {
    const expected = fixture.expectation
    lines.push(
      `| [${fixture.id}](../fixtures/${fixture.id}/README.md) | ${expected.format === "fdx" ? "FDX" : "Fountain"} | ${tableCell(expected.writerBehavior)} | ${expected.health ?? "—"} | ${expected.portability.map((item) => `\`${item.classification}\``).join(", ")} |`,
    )
  }
  lines.push(
    "",
    "## Input fingerprints",
    "",
    "SHA-256 identifies the exact input bytes used in a test run.",
    "",
    "| Case | SHA-256 |",
    "| --- | --- |",
  )
  for (const fixture of fixtures) lines.push(`| ${fixture.id} | \`${fixture.inputSha256}\` |`)
  lines.push(
    "",
    "Regenerate this page with `pnpm generate:compatibility` after editing a fixture.",
    "",
  )
  return lines.join("\n")
}
