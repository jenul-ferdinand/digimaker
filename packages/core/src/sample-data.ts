import { ParsedLesson } from './schemas/lesson.js';

export const sampleLessonData: ParsedLesson = {
  topic: 'Decisions',
  project: 'Crossy Road',
  description:
    'Decision making is important when there will be situations with multiple options and an option needs to be selected based on the given conditions.',
  projectExplainer:
    'In this lesson, we will create a Crossy Road style game where a penguin needs to cross the road and get to the other side without being hit by cars.',
  projectImage: null,
  getReadySection: ['Add Backdrop "street"', 'Add Sprites: Car and Penguin (set sizes to 40)'],
  addYourCodeSection: [
    {
      step: 'Car: When green flag is clicked, set Rotation style left-right, size 40%. Forever, move 5 steps, if on edge, bounce.',
      image: null,
    },
    {
      step: 'Penguin: When green flag is clicked, Forever: if UP arrow key is pressed, change y by 10.',
      image: null,
    },
    {
      step: 'Penguin: Inside Forever; If DOWN arrow key is pressed, change y by -10.',
      image: null,
    },
    {
      step: 'Penguin: Inside Forever; If RIGHT arrow key is pressed, change x by 10.',
      image: null,
    },
    {
      step: 'Penguin: Inside Forever; If LEFT arrow key is pressed, change x by -10.',
      image: null,
    },
    {
      step: 'Penguin: Inside Forever; If Penguin touches the car, say "Ouch!" and go back to its start position.',
      image: null,
    },
  ],
  tryItOutSection: [
    'Click the green flag and test your game',
    'Make sure the penguin can move in all directions',
    'Check if the car bounces at the edges',
  ],
  challengeSection: [
    { name: 'Bruise Penguin', task: 'Add sound effects when the penguin gets hit' },
    { name: 'Add more cars', task: 'Add more cars moving at different speeds' },
    { name: 'Multiple Levels', task: 'Create multiple levels with increasing difficulty' },
  ],
  newProject: {
    name: 'Energy Boost',
    task: 'Try creating a similar game with different sprites and backgrounds',
  },
  testYourself: 'http://youtube.com',
  funFact:
    'The original Crossy Road game was inspired by the classic arcade game Frogger from 1981!',
};
