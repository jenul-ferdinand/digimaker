import { Lesson, LessonLLM, ProgrammingLanguage } from '../schemas/lesson';
import { normaliseCodeBlock, normaliseText } from './normalise.js';

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function stripMarkdownEmphasis(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/__([^_]+)__/g, '$1');
}

function normaliseLessonText(text: string | null | undefined): string | null {
  if (text == null) return null;
  const base = normaliseText(text) ?? text;
  const decoded = decodeHtmlEntities(base);
  const stripped = stripMarkdownEmphasis(decoded);
  return stripped.trim();
}

function normaliseCodeText(text: string | null | undefined): string | null {
  if (text == null) return null;
  const decoded = decodeHtmlEntities(text);
  return normaliseCodeBlock(decoded) ?? decoded;
}

function normaliseStringArray(values: string[] | null | undefined): string[] | null {
  if (!values) return null;
  return values.map((value) => normaliseLessonText(value) ?? value);
}

function firstSentence(text: string): string {
  const match = text.match(/^[\s\S]*?[.!?](?=\s|$)/);
  return match ? match[0].trim() : text.trim();
}

function normaliseForCompare(text: string): string {
  return normaliseLessonText(text)
    ?.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim() ?? '';
}

function isNearDuplicate(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;

  const tokensA = new Set(a.split(' ').filter(Boolean));
  const tokensB = new Set(b.split(' ').filter(Boolean));
  if (!tokensA.size || !tokensB.size) return false;

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection += 1;
  }

  const union = tokensA.size + tokensB.size - intersection;
  const similarity = union > 0 ? intersection / union : 0;
  return similarity >= 0.9;
}

export function normaliseLessonContent(data: LessonLLM): LessonLLM {
  const mutable = data as Record<string, any>;

  mutable.topic = normaliseLessonText(mutable.topic) ?? mutable.topic;
  mutable.project = normaliseLessonText(mutable.project) ?? mutable.project;
  mutable.description = normaliseLessonText(mutable.description) ?? mutable.description;
  mutable.projectExplainer = normaliseLessonText(mutable.projectExplainer) ?? mutable.projectExplainer;
  mutable.getReadySection =
    normaliseStringArray(mutable.getReadySection) ?? mutable.getReadySection;
  mutable.tryItOutSection =
    normaliseStringArray(mutable.tryItOutSection) ?? mutable.tryItOutSection;
  mutable.testYourself = normaliseLessonText(mutable.testYourself) ?? mutable.testYourself;
  mutable.funFact = normaliseLessonText(mutable.funFact) ?? mutable.funFact;

  if (mutable.newProject) {
    mutable.newProject.name =
      normaliseLessonText(mutable.newProject.name) ?? mutable.newProject.name;
    mutable.newProject.task =
      normaliseLessonText(mutable.newProject.task) ?? mutable.newProject.task;
  }

  if (Array.isArray(mutable.addYourCodeSection)) {
    const addSection = mutable.addYourCodeSection;
    if (addSection.length > 0 && typeof addSection[0] === 'object' && addSection[0] !== null) {
      if ('step' in addSection[0]) {
        addSection.forEach((step: Record<string, any>) => {
          step.step = normaliseLessonText(step.step) ?? step.step;
        });
      } else if ('steps' in addSection[0]) {
        addSection.forEach((part: Record<string, any>) => {
          part.steps = normaliseStringArray(part.steps) ?? part.steps;
          part.codeBlock = normaliseCodeText(part.codeBlock) ?? part.codeBlock;
        });
      }
    }
  }

  if (Array.isArray(mutable.challengeSection)) {
    mutable.challengeSection.forEach((challenge: Record<string, any>) => {
      challenge.name = normaliseLessonText(challenge.name) ?? challenge.name;
      challenge.task = normaliseLessonText(challenge.task) ?? challenge.task;
      challenge.hintCode = normaliseCodeText(challenge.hintCode) ?? challenge.hintCode;
    });
  }

  if (Array.isArray(mutable.debugSection)) {
    mutable.debugSection.forEach((debugStep: Record<string, any>) => {
      debugStep.issue = normaliseLessonText(debugStep.issue) ?? debugStep.issue;
    });
  }

  if (typeof mutable.description === 'string' && typeof mutable.projectExplainer === 'string') {
    const description = mutable.description;
    const projectExplainer = mutable.projectExplainer;
    const normalizedDescription = normaliseForCompare(description);
    const normalizedExplainer = normaliseForCompare(projectExplainer);

    if (isNearDuplicate(normalizedDescription, normalizedExplainer)) {
      const shortened = firstSentence(projectExplainer);
      const shortenedNormalized = normaliseForCompare(shortened);

      if (!shortenedNormalized || shortenedNormalized === normalizedDescription) {
        mutable.projectExplainer = '';
      } else {
        mutable.projectExplainer = shortened;
      }
    }
  }

  return data;
}

export function normaliseLessonForType(data: Lesson): Lesson {
  if (data.lessonType !== 'block-based (scratch) lesson') {
    return data;
  }

  const addSection = data.addYourCodeSection as unknown;
  if (!Array.isArray(addSection) || addSection.length === 0) {
    return data;
  }

  const firstItem = addSection[0] as Record<string, unknown>;
  if (!firstItem || typeof firstItem !== 'object' || !('steps' in firstItem)) {
    return data;
  }

  const flattenedSteps: { step: string; imageSlot: null }[] = [];
  for (const part of addSection as Array<{ steps?: string[] }>) {
    if (!Array.isArray(part.steps)) continue;
    for (const stepText of part.steps) {
      flattenedSteps.push({ step: stepText, imageSlot: null });
    }
  }

  if (flattenedSteps.length > 0) {
    data.addYourCodeSection = flattenedSteps as any;
  }

  return data;
}

export function inferLessonType(
  textForLLM: string,
  footerLanguage: ProgrammingLanguage | null,
  data: LessonLLM
): Lesson['lessonType'] {
  // Dbug lesson checks
  if (/^(?:##\s*)?Debug\b/im.test(textForLLM)) {
    return 'debugging lesson';
  }
  if ('debugSection' in data) {
    return 'debugging lesson';
  }
  
  // Scratch checks
  if (footerLanguage === 'scratch') {
    return 'block-based (scratch) lesson';
  }

  const addSection = (data as { addYourCodeSection?: unknown }).addYourCodeSection;
  if (
    Array.isArray(addSection) &&
    addSection.length > 0 &&
    typeof addSection[0] === 'object' &&
    addSection[0] !== null &&
    'step' in (addSection[0] as Record<string, unknown>)
  ) {
    return 'block-based (scratch) lesson';
  }

  // Otherwise, programming language lesson
  return 'text-based (programming) lesson';
}
