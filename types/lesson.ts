export interface LessonData {
  id?: string;
  title: string;
  generatedAt: string;
  paragraphs: string[];
}

export interface StepWithImage {
  image: any;
  step: string;
}

export interface StepsWithCodeBlock {
  code_block: string;
  steps: Array<string>;
}

export interface Challenge {
  name: string;
  task: string;
}

export interface TestYourself {
  message: string;
  image: string | null;
  code: string | null;
}

export interface ParsedLesson {
  topic: string;
  project: string;
  description: string;
  projectExplainer: string;
  projectImage: any;
  getReadySection: Array<string>;
  addYourCodeSection: Array<StepWithImage>;
  codeBlock: string | null;
  tryItOutSection: Array<string> | null;
  challengeSection: Array<Challenge>;
  newProject: string;
  testYourself: TestYourself;
  funFact: string | null;
}
