import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { checkBoundary } from "./check-boundary.ts"

test("rejects nonpublic scoped imports and workspace dependencies in every common literal form", () => {
  const root = mkdtempSync(join(tmpdir(), "interop-dependencies-"))
  try {
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({ name: "@inkwell/screenplay-interop" }),
    )
    checkBoundary(root)
    const forbidden = "@inkwell/" + "example-internal"
    for (const source of [
      `import "${forbidden}"`,
      `import x from '${forbidden}/helpers'`,
      `await import(\`${forbidden}\`)`,
      `const x = require("${forbidden}")`,
      JSON.stringify({ dependencies: { example: "workspace" + ":*" } }),
    ]) {
      writeFileSync(join(root, "example.ts"), source)
      assert.throws(() => checkBoundary(root), /dependency/)
    }
    writeFileSync(join(root, "example.ts"), 'import "@inkwell/screenplay-interop"')
    checkBoundary(root)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
