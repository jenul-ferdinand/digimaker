import { LessonData } from "@common-types/lesson";

export const sampleLessonData: LessonData = {
  id: 'LESSON-001',
  title: 'Decisions - Crossy Road',
  generatedAt: new Date().toLocaleDateString('en-GB'),
  paragraphs: [
    'Decision making is important when there will be situations with multiple options and an option needs to be selected based on the given conditions.',
    'Example: When playing a game, if number of lives = 0, its game over.',
    'In this lesson, we will create a Crossy Road style game where a penguin needs to cross the road and get to the other side without being hit by cars.',
    'Get Ready: Add Backdrop "street". Add Sprites: Car and Penguin (set sizes to 40).',
    'Step 1 - Car: When green flag is clicked, set Rotation style left-right, size 40%. Forever, move 5 steps, if on edge, bounce.',
    'Step 2 - Penguin: When green flag is clicked, Forever: if UP arrow key is pressed, change y by 10.',
    'Step 3 - Penguin: Inside Forever; If DOWN arrow key is pressed, change y by -10.',
    'Step 4 - Penguin: Inside Forever; If RIGHT arrow key is pressed, change x by 10.',
    'Step 5 - Penguin: Inside Forever; If LEFT arrow key is pressed, change x by -10.',
    'Step 6 - Penguin: Inside Forever; If Penguin touches the car, say "Ouch!" and go back to its start position.',
  ],
};
