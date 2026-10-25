# Screenplay compatibility test cases

Use these original screenplay files to test import, export, and round-trip behavior in your tool. Each case describes the feature to inspect and the portability classification to consider.

The table records fixture expectations. To report an application result, record its version, the fixture commit and input hash, and the observed output from your test run.

| Case | Format | What to check | File health | Portability expectations |
| --- | --- | --- | --- | --- |
| [fdx-ab-pages](../fixtures/fdx-ab-pages/README.md) | FDX | Keep the page labels 3, 3A, and 3B distinct when inspecting or transferring inserted pages. | readable | `likely_lossy` |
| [fdx-custom-styles](../fixtures/fdx-custom-styles/README.md) | FDX | Identify the custom Weather Cue paragraph and preserve its words when mapping its style. | readable_with_warnings | `unknown` |
| [fdx-locked-pages](../fixtures/fdx-locked-pages/README.md) | FDX | Retain page 3’s lock marker and the locked scene number when the destination supports production locks. | readable | `likely_lossy` |
| [fdx-malformed-recoverable](../fixtures/fdx-malformed-recoverable/README.md) | FDX | Report the unclosed Text and Paragraph elements as malformed input; present a recoverable error to the writer. | malformed | `unknown` |
| [fdx-missing-revision-set](../fixtures/fdx-missing-revision-set/README.md) | FDX | Report the paragraph’s reference to revision set 9, which has no definition. | readable_with_warnings | `unknown` |
| [fdx-name-variants](../fixtures/fdx-name-variants/README.md) | FDX | Offer DR. MAYA and MAYA (V.O.) as related name variants while preserving both original cues. | readable | `expected_to_transfer` |
| [fdx-omitted-scenes](../fixtures/fdx-omitted-scenes/README.md) | FDX | Keep the omitted scene 8 placeholder and the following scene 9 number. | readable | `preserved_as_data_with_changed_controls` |
| [fdx-revision-sets](../fixtures/fdx-revision-sets/README.md) | FDX | Keep both revision sets, their colors, and the action paragraph’s revision reference. | readable | `preserved_as_data_with_changed_controls` |
| [fdx-scene-numbers](../fixtures/fdx-scene-numbers/README.md) | FDX | Preserve scene numbers 7 and 7A on their corresponding headings. | readable | `expected_to_transfer` |
| [fountain-1-1-core](../fixtures/fountain-1-1-core/README.md) | Fountain | Keep headings, action, character cues, parentheticals, dialogue, and transitions distinct. | — | `expected_to_transfer` |
| [fountain-centered-page-breaks](../fixtures/fountain-centered-page-breaks/README.md) | Fountain | Render the centered line and explicit page break as layout instructions. | — | `transfers_with_visible_difference` |
| [fountain-dual-dialogue](../fixtures/fountain-dual-dialogue/README.md) | Fountain | Keep the two speakers paired as simultaneous dialogue after import and export. | — | `expected_to_transfer` |
| [fountain-forced-elements](../fixtures/fountain-forced-elements/README.md) | Fountain | Recognize forced scene headings, action, mixed-case character cues, and transitions. | — | `expected_to_transfer` |
| [fountain-notes-sections-boneyard](../fixtures/fountain-notes-sections-boneyard/README.md) | Fountain | Keep notes, sections, synopses, and omitted text separate from spoken dialogue. | — | `preserved_as_data_with_changed_controls` |
| [fountain-title-page](../fixtures/fountain-title-page/README.md) | Fountain | Keep title, author, credit, draft date, and contact fields on the title page. | — | `expected_to_transfer` |
| [fountain-unicode](../fixtures/fountain-unicode/README.md) | Fountain | Preserve accented names, Japanese and Korean text, curly quotation marks, and punctuation. | — | `expected_to_transfer` |

## Input fingerprints

SHA-256 identifies the exact input bytes used in a test run.

| Case | SHA-256 |
| --- | --- |
| fdx-ab-pages | `7295f7a7a017c5bf81d04038518175b90fa10dbaca26ce21b89e7371160831fd` |
| fdx-custom-styles | `cff96eca928a5c76e1bc56b56ead680da0ec01d1b617df5890e61e0ca1f13e1e` |
| fdx-locked-pages | `8b5fc1035b4832dba96072a248d3e7831b7d48c13602fc8729ef7a22f4e4778d` |
| fdx-malformed-recoverable | `2741782752b356ca4fa056ea1b038a9a812253668cc803ffd38a0c0ecaae72bd` |
| fdx-missing-revision-set | `202e61ec49fd84db0e0857bcb652d1febc0c2b543e251f4ad997ba9d1cf18dc3` |
| fdx-name-variants | `5693472aeed9537af823efd82057f8d35aa5c0b12a34ded0e2ecc0178c86d4a6` |
| fdx-omitted-scenes | `ab72e51773bc20da863be259ba9f65a702e8b31d1624faee437feb69e2c20096` |
| fdx-revision-sets | `3467ed1a5743051d4dcd805c806af1238555baf96e647c7d59da8574b044db38` |
| fdx-scene-numbers | `c4528d2727ba045ee6850288df43a21b125a395307e76568287717f08964968d` |
| fountain-1-1-core | `002387636ff800649748b6fca8d8d65dd684c0deab5f197631e133da0ca92a41` |
| fountain-centered-page-breaks | `088a10fed107d7624c25fd45553fe80d9c4aad58bb44739c6ed4458c2fa2c956` |
| fountain-dual-dialogue | `ad3c5ef69ef1e57ce8515b3ff1d9a073506387a02c619af97820c1a49dc6ccb9` |
| fountain-forced-elements | `ba901342b91cc9b6f1c39bfaeb542005301b42457b3e9f2f0147d9a209483d07` |
| fountain-notes-sections-boneyard | `494d337220faa48eb18439eb483e8ddb707146a9b20aa2e8b45d634564045470` |
| fountain-title-page | `58e16d3b0b330ca7ca3851322734c0cf0a16a998a18b9e823315db12c1bd61a1` |
| fountain-unicode | `70811b7796176a048d7065b4669086e96ddaac801f1d450d96fc01b3f542f90a` |

Regenerate this page with `pnpm generate:compatibility` after editing a fixture.
