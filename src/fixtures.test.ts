import assert from "node:assert/strict"
import { execFileSync, spawnSync } from "node:child_process"
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"
import { compatibilityMarkdown, loadFixtures } from "./fixtures.ts"

const packageRoot = fileURLToPath(new URL("../", import.meta.url))
const cli = join(packageRoot, "src/cli.ts")
const REQUIRED_CASES = [
  "fountain-1-1-core",
  "fountain-title-page",
  "fountain-dual-dialogue",
  "fountain-forced-elements",
  "fountain-notes-sections-boneyard",
  "fountain-unicode",
  "fountain-centered-page-breaks",
  "fdx-revision-sets",
  "fdx-locked-pages",
  "fdx-ab-pages",
  "fdx-scene-numbers",
  "fdx-omitted-scenes",
  "fdx-custom-styles",
  "fdx-malformed-recoverable",
  "fdx-missing-revision-set",
  "fdx-name-variants",
]

function scratch(run: (root: string) => void): void {
  const root = mkdtempSync(join(tmpdir(), "screenplay-interop-test-"))
  try {
    cpSync(join(packageRoot, "schemas"), join(root, "schemas"), { recursive: true })
    cpSync(join(packageRoot, "fixtures"), join(root, "fixtures"), { recursive: true })
    run(root)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

function editExpectation(
  root: string,
  id: string,
  edit: (value: Record<string, unknown>) => void,
): void {
  const path = join(root, "fixtures", id, "expected.json")
  const value: unknown = JSON.parse(readFileSync(path, "utf8"))
  assert.ok(isObject(value))
  edit(value)
  writeFileSync(path, JSON.stringify(value))
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

test("the collection contains each original case and deterministic fingerprints", () => {
  const fixtures = loadFixtures(packageRoot)
  const ids = new Set(fixtures.map((fixture) => fixture.id))
  for (const id of REQUIRED_CASES) assert.ok(ids.has(id), `Missing release case: ${id}`)
  assert.equal(ids.size, fixtures.length)
  for (const fixture of fixtures) assert.match(fixture.inputSha256, /^[0-9a-f]{64}$/)
  assert.equal(compatibilityMarkdown(fixtures), compatibilityMarkdown(loadFixtures(packageRoot)))
  assert.match(compatibilityMarkdown(fixtures), /fixture expectations/)
})

test("malformed XML stays available as an intentionally damaged input", () => {
  const fixture = loadFixtures(packageRoot).find((item) => item.id === "fdx-malformed-recoverable")
  assert.ok(fixture)
  assert.equal(fixture.expectation.health, "malformed")
  assert.ok(!fixture.input.includes("</Text>"))
})

test("a malformed case may have well-formed XML but an invalid screenplay structure", () =>
  scratch((root) => {
    writeFileSync(
      join(root, "fixtures/fdx-malformed-recoverable/input.fdx"),
      "<DifferentContainer/>",
    )
    assert.ok(loadFixtures(root).some((fixture) => fixture.id === "fdx-malformed-recoverable"))
  }))

test("Fountain text does not have to be well-formed XML", () =>
  scratch((root) => {
    writeFileSync(
      join(root, "fixtures/fountain-1-1-core/input.fountain"),
      "INT. ROOM - DAY\n\nAn <unclosed> label remains visible.\n",
    )
    assert.ok(loadFixtures(root).some((fixture) => fixture.id === "fountain-1-1-core"))
  }))

const mutations: { name: string; mutate: (root: string) => void; message: RegExp }[] = [
  {
    name: "damaged readable FDX XML",
    mutate: (root) =>
      writeFileSync(join(root, "fixtures/fdx-ab-pages/input.fdx"), "<FinalDraft><Content>"),
    message: /expected readable FDX contains invalid XML/,
  },
  {
    name: "damaged warning-bearing FDX XML",
    mutate: (root) =>
      writeFileSync(join(root, "fixtures/fdx-custom-styles/input.fdx"), "<FinalDraft><Content>"),
    message: /expected readable FDX contains invalid XML/,
  },
  {
    name: "missing corpus",
    mutate: (root) => rmSync(join(root, "fixtures"), { recursive: true }),
    message: /ENOENT/,
  },
  {
    name: "empty corpus",
    mutate: (root) => {
      for (const fixture of loadFixtures(root))
        rmSync(join(root, "fixtures", fixture.id), { recursive: true })
    },
    message: /empty/,
  },
  {
    name: "wrong fixture id",
    mutate: (root) =>
      editExpectation(root, "fdx-ab-pages", (value) => {
        value.fixtureId = "other-case"
      }),
    message: /fixtureId/,
  },
  {
    name: "format and input disagree",
    mutate: (root) =>
      editExpectation(root, "fdx-ab-pages", (value) => {
        value.format = "fountain"
      }),
    message: /invalid directory/,
  },
  {
    name: "missing FDX health",
    mutate: (root) =>
      editExpectation(root, "fdx-ab-pages", (value) => {
        delete value.health
      }),
    message: /health/,
  },
  {
    name: "invalid class",
    mutate: (root) =>
      editExpectation(root, "fdx-ab-pages", (value) => {
        value.portability = [{ id: "pages", title: "Inserted pages", classification: "guaranteed" }]
      }),
    message: /invalid expectations/,
  },
  {
    name: "duplicate portability ids",
    mutate: (root) =>
      editExpectation(root, "fdx-ab-pages", (value) => {
        const item = { id: "pages", title: "Inserted pages", classification: "likely_lossy" }
        value.portability = [item, item]
      }),
    message: /duplicate portability/,
  },
  {
    name: "malformed expected JSON",
    mutate: (root) => writeFileSync(join(root, "fixtures/fdx-ab-pages/expected.json"), "{"),
    message: /Cannot read JSON/,
  },
  {
    name: "absent input",
    mutate: (root) => rmSync(join(root, "fixtures/fdx-ab-pages/input.fdx")),
    message: /exactly one input/,
  },
  {
    name: "two inputs",
    mutate: (root) =>
      writeFileSync(join(root, "fixtures/fdx-ab-pages/input.fountain"), "INT. TEST - DAY"),
    message: /exactly one input/,
  },
  {
    name: "empty input",
    mutate: (root) => writeFileSync(join(root, "fixtures/fdx-ab-pages/input.fdx"), " \n"),
    message: /Empty file/,
  },
  {
    name: "missing documentation",
    mutate: (root) => rmSync(join(root, "fixtures/fdx-ab-pages/README.md")),
    message: /ENOENT/,
  },
  {
    name: "missing declaration",
    mutate: (root) => writeFileSync(join(root, "fixtures/fdx-ab-pages/copyright.md"), "Pending"),
    message: /original-fiction/,
  },
  {
    name: "linked input",
    mutate: (root) => {
      const input = join(root, "fixtures/fdx-ab-pages/input.fdx")
      rmSync(input)
      symlinkSync(join(root, "fixtures/fdx-locked-pages/input.fdx"), input)
    },
    message: /regular file/,
  },
  {
    name: "unrepresented class",
    mutate: (root) => {
      rmSync(join(root, "fixtures/fountain-centered-page-breaks"), { recursive: true })
    },
    message: /does not cover classification/,
  },
]

for (const mutation of mutations) {
  test(`rejects ${mutation.name}`, () =>
    scratch((root) => {
      mutation.mutate(root)
      assert.throws(() => loadFixtures(root), mutation.message)
      const result = spawnSync(process.execPath, [cli, "check", "--root", root], {
        encoding: "utf8",
      })
      assert.equal(result.status, 1, result.stdout + result.stderr)
      assert.match(result.stderr, mutation.message)
    }))
}

test("generating twice preserves bytes, and a changed expectation changes the table", () =>
  scratch((root) => {
    execFileSync(process.execPath, [cli, "generate", "--root", root])
    const path = join(root, "docs/compatibility.md")
    const first = readFileSync(path, "utf8")
    execFileSync(process.execPath, [cli, "generate", "--root", root])
    assert.equal(readFileSync(path, "utf8"), first)
    editExpectation(root, "fdx-ab-pages", (value) => {
      value.writerBehavior = "Keep page labels visible | including insertions."
    })
    execFileSync(process.execPath, [cli, "generate", "--root", root])
    const changed = readFileSync(path, "utf8")
    assert.notEqual(changed, first)
    assert.match(changed, /visible \\\| including/)
  }))

test("unsupported arguments fail with usage rather than running a default action", () => {
  const result = spawnSync(process.execPath, [cli, "publish"], { encoding: "utf8" })
  assert.equal(result.status, 2)
  assert.match(result.stderr, /Usage/)
})
