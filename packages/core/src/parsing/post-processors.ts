import { Lesson, LessonLLM, ProgrammingLanguage } from '../schemas/lesson';

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
