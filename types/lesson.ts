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
  codeBlock: string;
  steps: Array<string>;
}

export interface Challenge {
  name: string;
  task: string;
}

export interface NewProject {
  name: string;
  task: string;
}

export interface ParsedLesson {
  topic: string;
  project: string;
  description: string;
  projectExplainer: string;
  projectImage: any;
  getReadySection: Array<string>;
  addYourCodeSection: Array<StepWithImage> | StepsWithCodeBlock;
  codeBlock: string | null;
  tryItOutSection: Array<string> | null;
  challengeSection: Array<Challenge>;
  newProject: NewProject;
  testYourself: string; // link to quiz
  funFact: string | null;
}
