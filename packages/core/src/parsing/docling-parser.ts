import { ImageSlot } from '../schemas/lesson.js';

const IMAGE_MARKER = '<!-- image -->';

const SECTION_HEADERS = {
  getReady: /^##\s*Get\s*Ready/i,
  addYourCode: /^##\s*(Add\s*Your\s*Code|My\s*First\s*Program)/i,
  tryItOut: /^##\s*Try\s*It\s*Out/i,
  challenge: /^##\s*Challenge/i,
  testYourself: /^##\s*Test\s*Yourself/i,
  funFact: /^##\s*Fun\s*Fact/i,
};

export interface ParsedSection {
  content: string;
  imageSlots: ImageSlot[];
}

// For challenges, we need to track which challenge each image belongs to
export interface ChallengeImageMapping {
  challengeIndex: number; // 0-based index of the challenge within the section
  imageSlot: ImageSlot;
}

export interface ChallengeParsedSection extends ParsedSection {
  challengeImageMappings: ChallengeImageMapping[];
}

export interface DoclingParsedSections {
  preface: ParsedSection;
  getReady: ParsedSection;
  addYourCode: ParsedSection;
  tryItOut: ParsedSection;
  challenge: ChallengeParsedSection;
  testYourself: ParsedSection;
  funFact: ParsedSection;
}

interface SectionSplit {
  before: string;
  after: string;
}

function countImageMarkers(content: string): number {
  return (content.match(new RegExp(IMAGE_MARKER, 'g')) || []).length;
}

function createImageSlots(count: number, prefix: string): ImageSlot[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}_img_${i + 1}`,
  }));
}

/**
 * Parse challenge section content to map images to specific challenges.
 * Individual challenges are identified by ## headers within the challenge section.
 * Images are assigned to the challenge they appear under.
 */
function parseChallengeImageMappings(content: string): ChallengeImageMapping[] {
  const mappings: ChallengeImageMapping[] = [];
  const lines = content.split('\n');

  // Find the main "## Challenge" header first, then look for sub-challenges
  // Sub-challenges typically start with ## followed by the challenge name
  let currentChallengeIndex = -1; // -1 means before any challenge
  let imageCounter = 0;
  let isAfterMainHeader = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check if this is the main Challenge header (## Challenge or ## Challenge!)
    if (SECTION_HEADERS.challenge.test(trimmedLine)) {
      isAfterMainHeader = true;
      continue;
    }

    // Check if this is a sub-challenge header (## followed by text, but not a known section)
    if (isAfterMainHeader && /^##\s+\S/.test(trimmedLine)) {
      // Make sure it's not another main section header
      const isMainSection = Object.values(SECTION_HEADERS).some((pattern) =>
        pattern.test(trimmedLine)
      );
      if (!isMainSection) {
        currentChallengeIndex++;
      }
    }

    // Check for image marker
    if (trimmedLine === IMAGE_MARKER && currentChallengeIndex >= 0) {
      mappings.push({
        challengeIndex: currentChallengeIndex,
        imageSlot: { id: `challenge_img_${++imageCounter}` },
      });
    }
  }

  return mappings;
}

function splitAtHeader(markdown: string, headerPattern: RegExp): SectionSplit | null {
  const lines = markdown.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (headerPattern.test(lines[i].trim())) {
      return {
        before: lines.slice(0, i).join('\n'),
        after: lines.slice(i).join('\n'),
      };
    }
  }
  return null;
}

function extractSection(markdown: string, startPattern: RegExp, endPatterns: RegExp[]): string {
  const startSplit = splitAtHeader(markdown, startPattern);
  if (!startSplit) {
    return '';
  }

  let sectionContent = startSplit.after;

  for (const endPattern of endPatterns) {
    const endSplit = splitAtHeader(sectionContent, endPattern);
    if (endSplit) {
      sectionContent = endSplit.before;
      break;
    }
  }

  return sectionContent;
}

export function parseDoclingMarkdown(markdown: string): DoclingParsedSections {
  const sections: DoclingParsedSections = {
    preface: { content: '', imageSlots: [] },
    getReady: { content: '', imageSlots: [] },
    addYourCode: { content: '', imageSlots: [] },
    tryItOut: { content: '', imageSlots: [] },
    challenge: { content: '', imageSlots: [], challengeImageMappings: [] },
    testYourself: { content: '', imageSlots: [] },
    funFact: { content: '', imageSlots: [] },
  };

  // Extract preface (everything before Get Ready), with image slots
  const getReadySplit = splitAtHeader(markdown, SECTION_HEADERS.getReady);
  if (getReadySplit) {
    sections.preface.content = getReadySplit.before.trim();
    sections.preface.imageSlots = createImageSlots(
      countImageMarkers(sections.preface.content),
      'preface'
    );
  }

  // Extract Get Ready section, no images in this part
  sections.getReady.content = extractSection(markdown, SECTION_HEADERS.getReady, [
    SECTION_HEADERS.addYourCode,
    SECTION_HEADERS.tryItOut,
    SECTION_HEADERS.challenge,
    SECTION_HEADERS.testYourself,
    SECTION_HEADERS.funFact,
  ]).trim();

  // Extract Add Your Code section, with image slots
  sections.addYourCode.content = extractSection(markdown, SECTION_HEADERS.addYourCode, [
    SECTION_HEADERS.tryItOut,
    SECTION_HEADERS.challenge,
    SECTION_HEADERS.testYourself,
    SECTION_HEADERS.funFact,
  ]).trim();
  sections.addYourCode.imageSlots = createImageSlots(
    countImageMarkers(sections.addYourCode.content),
    'addYourCode'
  );

  // Extract remaining sections, no images in this part.
  sections.tryItOut.content = extractSection(markdown, SECTION_HEADERS.tryItOut, [
    SECTION_HEADERS.challenge,
  ]).trim();

  // Extract Challenge section, with image mappings (for Scratch lessons)
  sections.challenge.content = extractSection(markdown, SECTION_HEADERS.challenge, [
    SECTION_HEADERS.testYourself,
    SECTION_HEADERS.funFact,
  ]).trim();
  // Parse challenge-specific image mappings (tracks which challenge each image belongs to)
  sections.challenge.challengeImageMappings = parseChallengeImageMappings(
    sections.challenge.content
  );
  // Also create flat imageSlots for compatibility
  sections.challenge.imageSlots = sections.challenge.challengeImageMappings.map((m) => m.imageSlot);

  sections.testYourself.content = extractSection(markdown, SECTION_HEADERS.testYourself, [
    SECTION_HEADERS.funFact,
  ]).trim();

  const funFactSplit = splitAtHeader(markdown, SECTION_HEADERS.funFact);
  if (funFactSplit) {
    sections.funFact.content = funFactSplit.after.trim();
  }

  return sections;
}

export function assignImagesToSlots(
  sections: DoclingParsedSections,
  images: string[]
): DoclingParsedSections {
  let imageIndex = 0;

  const assignToSection = (section: ParsedSection) => {
    for (const slot of section.imageSlots) {
      if (imageIndex < images.length) {
        slot.base64 = images[imageIndex];
        imageIndex++;
      }
    }
  };

  // Assign to sections that track image slots (in document order)
  assignToSection(sections.preface);
  assignToSection(sections.addYourCode);
  assignToSection(sections.challenge);

  return sections;
}
