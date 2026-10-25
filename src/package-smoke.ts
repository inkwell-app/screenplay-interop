import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { lstatSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { loadFixtures } from "./fixtures.ts"

const source = fileURLToPath(new URL("../", import.meta.url))
const manager = process.env.npm_execpath
if (!manager) throw new Error("Run this check with pnpm smoke:package")
const temporary = mkdtempSync(join(tmpdir(), "screenplay-interop-pack-"))
try {
  execFileSync(process.execPath, [manager, "pack", "--pack-destination", temporary], {
    cwd: source,
    stdio: "inherit",
  })
  const archives = readdirSync(temporary).filter((name) => name.endsWith(".tgz"))
  assert.equal(archives.length, 1, "Expected exactly one package archive")
  const archive = archives[0]
  assert.ok(archive)
  writeFileSync(
    join(temporary, "package.json"),
    JSON.stringify({ name: "interop-consumer-smoke", private: true }),
  )
  execFileSync(
    process.execPath,
    [
      manager,
      "add",
      "--ignore-scripts",
      "--ignore-workspace",
      "--store-dir",
      join(temporary, "store"),
      join(temporary, archive),
    ],
    {
      cwd: temporary,
      stdio: "inherit",
    },
  )
  const installed = join(temporary, "node_modules/@inkwell/screenplay-interop")
  const original = loadFixtures(source)
  const packed = loadFixtures(installed)
  assert.deepEqual(
    packed,
    original,
    "Installed fixtures must preserve source bytes and expectations",
  )
  const manifest: unknown = JSON.parse(readFileSync(join(source, "package.json"), "utf8"))
  assert.ok(manifest && typeof manifest === "object" && "files" in manifest)
  assert.ok(Array.isArray(manifest.files))
  function compareAsset(relative: string): void {
    const path = join(source, relative)
    if (lstatSync(path).isDirectory()) {
      for (const name of readdirSync(path)) compareAsset(join(relative, name))
    } else {
      assert.deepEqual(readFileSync(join(installed, relative)), readFileSync(path), relative)
    }
  }
  for (const asset of manifest.files) {
    assert.equal(typeof asset, "string")
    compareAsset(asset)
  }
  process.stdout.write(
    `Packed install verified: ${packed.length} complete fixtures, schemas, license, and documentation.\n`,
  )
} finally {
  rmSync(temporary, { recursive: true, force: true })
}
