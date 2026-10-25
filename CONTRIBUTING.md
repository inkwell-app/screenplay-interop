# Contributing to screenplay-interop

Help developers preserve the details writers need when a screenplay moves
between tools. Add a small fictional example, improve an expectation, or fix
the validation runner.

## Start with a behavior

Describe what the writer should still see after import or export: a scene
number, a revision mark, a line of dialogue, or a page break. Search the
[existing cases](README.md#fixture-catalog) for a close match. An
[interop issue](https://github.com/inkwell-app/screenplay-interop/issues/new?template=interop.yml)
is a useful place to discuss a new case or an unexpected result.

## Add a case

Create `fixtures/<kebab-case-id>/` with these files:

| File | Content |
|---|---|
| `README.md` | What the writer expects and how to test it |
| `input.fountain` or `input.fdx` | One short original-fiction input |
| `expected.json` | Behavior, format, and portability classes matching `schemas/expected.schema.json` |
| `copyright.md` | Authorship and the original-fiction declaration below |

Use this declaration: “This fixture is original fiction. It is not derived
from a titled produced or published screenplay.” Name the author and license
the contribution under MIT. Submit text you wrote or have permission to license.
Keep published screenplay excerpts and private drafts out of attachments.

Use the same ID in the directory name and `expected.json`. Add your case to the
README's catalog and describe changes to existing cases in `CHANGELOG.md`.
The [portability classes](README.md#portability-classes) describe the consequence
for the writer; choose the class for each feature independently.

## Run the checks

Follow [Install and run](README.md#install-and-run), then:

```bash
pnpm typecheck
pnpm test
pnpm smoke:package
git diff -- docs/compatibility.md
```

Commit the generated catalog with your fixture. The runner checks the input
files, schema, IDs, and declarations. For a parser or importer result, include
the tool version, fixture commit, and observed output in your report.

## Open a pull request

Name the fixture or runner change in the title. Explain the behavior it covers
and the checks you ran. Keep dependencies independently installable so other
tools can reuse the collection. Reviews follow our [code of conduct](CODE_OF_CONDUCT.md).

For a security issue, use the contact in [SECURITY.md](SECURITY.md).
