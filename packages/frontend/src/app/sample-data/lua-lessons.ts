import { Lesson } from '@digimakers/core/schemas';

export const sampleLuaRandomnessQuiz: Lesson = {
  topic: 'Randomness',
  project: 'Operator Quiz',
  level: 2,
  description:
    'The term random refers to any collection of [data](https:/www.computerhope.com/jargon/d/data.htm) or information with no determined order, or is chosen in a way that is unknown beforehand. math.random function in Lua is used to generate pseudo-random numbers.',
  projectExplainer: 'Take a quiz on the Math operators used to get the result',
  getReadySection: ['Follow the steps below to finish your code'],
  addYourCodeSection: [
    {
      steps: ['Main Program : Get two random numbers between 1 to 10.'],
      codeBlock:
        'math.randomseed(os.time())\nrandom_operator = math.random(1,2)\nnum1 = math.random(1,10)\nnum2 = math.random(1,10)',
    },
    {
      steps: ['Main Program : Make a list called ‘colors’'],
      codeBlock:
        'if random_operator == 1 then\n  correct_answer = "+"\n  result = num1 + num2\nelseif random_operator == 2 then\n  correct_answer = "-"\n  result = num1 - num2\nend',
    },
    {
      steps: ['Main Program : Print the two numbers and the result'],
      codeBlock:
        'print("The random numbers are", num1, "and", num2)\nprint("And the result is", result)',
    },
    {
      steps: [
        'Main Program : Ask player for the operator used. If answer is correct, print “Well done!”',
      ],
      codeBlock:
        'print("Which operator was used?")\nanswer = io.read()\nif answer == correct_answer then\n  print("correct, well done!")\nend',
    },
  ],
  tryItOutSection: ['Click save and run your project.'],
  challengeSection: [
    {
      name: 'Number Range',
      task: 'Update the program to have 2 numbers between 1 - 50',
      hintCode: null,
    },
    {
      name: 'Not Right',
      task: 'If answer is incorrect, print “That’s not right, try again”',
      hintCode: null,
    },
    {
      name: 'Add a loop to ask 10 questions',
      task: 'Add a loop to ask 10 questions',
      hintCode: 'for count = 1, 10 do\n  --quiz\nend',
    },
  ],
  newProject: {
    name: 'Count Up',
    task: 'Use a loop to print the numbers 1 to 10 in order',
  },
  testYourself: null,
  funFact:
    'Lua was developed in 1993 by Roberto Ierusalimschy, Luiz Henrique de Figueiredo, and Waldemar Celes at the Pontifical Catholic University of Rio de Janeiro in Brazil. The name ‘Lua,’ meaning ‘moon’ in Portuguese, reflects the language’s Brazilian heritage.',
  lessonType: 'text-based (programming) lesson',
  programmingLanguage: 'lua',
  prefaceImageSlots: [
    {
      id: 'preface_img_1',
      base64:
        'data:image/png;base64,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',
    },
  ],
};
