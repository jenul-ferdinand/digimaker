# TODO - Digimaker Lesson PDF Pipeline

This file captures current context, known issues, and next steps for the
docx -> JSON -> Angular PDF pipeline. Use this to pick up work next session.

## Current State (Summary)

- CLI converts .docx files to PDFs via Angular frontend + Puppeteer.
- Parsing flow:
  1. Extract docling markdown (preferred) or mammoth text (fallback).
  2. Run LLM to extract structured lesson data.
  3. Post-process to assign images and infer lessonType.
- Lesson types:
  - "text-based (programming) lesson"
  - "block-based (scratch) lesson"
  - "debugging lesson"
- LLM schemas no longer require lessonType; lessonType is inferred.
- Footer language (if present) overrides programmingLanguage.

## Where Output Lives

- PDFs and PNG page renders:
  `packages/cli/output/`
  - `Lesson Name.pdf`
  - `Lesson Name/page-1.png`, `page-2.png`, ...

## Commands

- Build core:
  `npm run build:core`
- Run CLI conversion:
  `npm run dev:cli -- convert ./docs/example-templates`
  - Note: to pass CLI args, use double "--":
    `npm run dev:cli -- convert ./docs/example-templates -- --concurrency=1`

## Key Files (Parser + Schema + Frontend)

- Parsing:
  - `packages/core/src/parsing/docx-parser.ts`
  - `packages/core/src/parsing/prompts.ts`
  - `packages/core/src/parsing/normalise.ts`
  - `packages/core/src/post-processors.ts` (helper for lessonType)
- Schemas:
  - `packages/core/src/schemas/lesson.ts`
- Frontend:
  - `packages/frontend/src/app/components/dumb/lesson-preview/lesson-preview.component.html`
  - `packages/frontend/src/app/components/dumb/lesson-preview/add-your-code/add-your-code.component.*`
  - `packages/frontend/src/app/components/dumb/lesson-preview/test-yourself/test-yourself.component.*`

## Visual Review Findings (All Lesson PNGs)

1. Debug lessons render almost empty
   - `Lesson9 - Debug/page-1.png` shows only header + get ready.
   - Missing debug section UI.
2. Markdown/HTML entities leak into UI
   - Examples: `**Add Backdrop**`, `&amp;`, `&lt;script&gt;`.
   - Appears in many lessons (Scratch + HTML/JS).
3. testYourself renders as a quiz button even when it is plain text
   - Scratch lessons show "Click me to go to quiz" but content is a question.
4. Code blocks sometimes show literal `\\n` and look cramped
   - Some code blocks render with escaped newlines.
5. Duplicate description vs projectExplainer
   - Some lessons show the same text in the orange header and again below it.
6. Challenge hint/code pills can overflow horizontally
   - Long code snippets get truncated.

## Recommended Fixes (Concrete)

### Core - Post-processing (High impact)

1. Normalize all text fields (not only description):
   - Strip markdown emphasis `**` / `__`.
   - Decode HTML entities (`&amp;`, `&lt;`, `&gt;`, `&quot;`).
   - Apply to: topic, project, description, projectExplainer, getReadySection,
     addYourCode steps, challenges, newProject task, funFact, testYourself.
   - Implement in `packages/core/src/post-processors.ts` and call from
     `packages/core/src/parsing/docx-parser.ts` after LLM parse.
2. Normalize code blocks:
   - If code contains `\\n` and no real newlines, replace `\\n` with `\n`.
   - Reuse or extend `normaliseCodeBlock` in
     `packages/core/src/parsing/normalise.ts`.
3. Dedupe description vs projectExplainer:
   - If nearly identical, keep description and blank or shorten projectExplainer
     (e.g., first sentence).

### Frontend - Rendering

1. Debug lesson section:
   - Add new component for debug items (link + issue text).
   - Render when `lessonType === 'debugging lesson'`.
2. testYourself handling:
   - If URL => button/link.
   - Else render as plain text or Q/A block.
3. Challenge hint/code wrap:
   - Allow code pills to wrap or use smaller font / multi-line display.
   - Update `challenge-section` styles.

## Schema / Parser Adjustments

- LLM schema should stay as union without lessonType.
- Ensure helper infers lessonType based on:
  - "Debug" header, presence of debugSection,
  - footerLanguage === "scratch",
  - or Add Your Code steps with `step` field (scratch).
- Keep Lesson schema discriminated by lessonType for runtime validation.

## Suggested Work Plan

1. Implement core text/code normalization post-processors.
2. Add debug section UI + testYourself rendering logic.
3. Re-run CLI conversion and review PNGs.
4. Iterate on prompt changes only if normalization is insufficient.
