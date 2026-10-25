import { mkdirSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { compatibilityMarkdown, loadFixtures } from "./fixtures.ts"

const args = process.argv.slice(2)
const command = args[0]
if (
  (command !== "check" && command !== "generate") ||
  (args.length !== 1 && (args.length !== 3 || args[1] !== "--root" || !args[2]))
) {
  process.stderr.write("Usage: node src/cli.ts <check|generate> [--root directory]\n")
  process.exitCode = 2
} else {
  try {
    const root = args[2] ? resolve(args[2]) : fileURLToPath(new URL("../", import.meta.url))
    const fixtures = loadFixtures(root)
    if (command === "generate") {
      mkdirSync(resolve(root, "docs"), { recursive: true })
      writeFileSync(resolve(root, "docs/compatibility.md"), compatibilityMarkdown(fixtures))
    }
    process.stdout.write(
      `${fixtures.length} fixtures validated${command === "generate" ? "; catalog generated" : ""}.\n`,
    )
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
