import { lstatSync, readdirSync, readFileSync } from "node:fs"
import { extname, join, relative, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const PUBLIC_PACKAGES = new Set(["screenplay-interop", "fdx-inspect"])
const SOURCE_EXTENSIONS = new Set([".ts", ".mts", ".cts", ".json", ".yaml", ".yml"])

export function checkBoundary(root: string): void {
  readFileSync(join(root, "package.json"), "utf8")
  function walk(directory: string): void {
    for (const name of readdirSync(directory)) {
      if (name === "node_modules" || name === ".git") continue
      const path = join(directory, name)
      const stat = lstatSync(path)
      if (stat.isSymbolicLink()) throw new Error(`Linked source: ${relative(root, path)}`)
      if (stat.isDirectory()) {
        walk(path)
        continue
      }
      if (!SOURCE_EXTENSIONS.has(extname(name))) continue
      const source = readFileSync(path, "utf8")
      for (const hit of source.matchAll(/["'`]@inkwell\/([a-z0-9.-]+)/g)) {
        if (!PUBLIC_PACKAGES.has(hit[1] ?? ""))
          throw new Error(`Unpublished package dependency in ${relative(root, path)}`)
      }
      if (/["'`]workspace:/.test(source))
        throw new Error(`Workspace dependency in ${relative(root, path)}`)
    }
  }
  walk(root)
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    checkBoundary(fileURLToPath(new URL("..", import.meta.url)))
    process.stdout.write("Package dependency boundary passed\n")
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
