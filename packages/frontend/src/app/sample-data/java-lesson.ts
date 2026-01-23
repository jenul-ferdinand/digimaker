import { Lesson } from '@digimakers/core/schemas';

export const sampleJavaLesson: Lesson = {
  lessonType: 'text-based (programming) lesson',
  topic: 'List',
  project: 'Currency Converter',
  description:
    'A list is used for storing data, just like a variable. However, a variable can store only one piece of data at a time in a named location, a list can store many.\n\nExample: list employees can store names of all employees in a workplace',
  projectExplainer: 'Utility to convert from Aussie Dollar to another country currency',
  programmingLanguage: 'java',
  prefaceImageSlots: [
    {
      id: 'preface_img_1',
      base64:
        'data:image/png;base64,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',
    },
  ],
  getReadySection: ['Get project: Click on “Code” and then click save'],
  addYourCodeSection: [
    {
      codeBlock:
        'convAmt = amt * currency[ch];\nif (ch == 1)\n\tSystem.out.println(amt + " in Aussie $ = " + convAmt + " in US Dollars");\nelse if (ch == 2)\n\tSystem.out.println(amt + " in Aussie $ = " + convAmt + " in British Pounds");\nelse if (ch == 3)\n\tSystem.out.println(amt + " in Aussie $ = " + convAmt + " in Euro");\ninput.close();',
      steps: [
        'Main Program: Calculate converted amount. Use IF conditions – to check',
        'if choice = 1, print conversion in US dollars',
        'if choice = 2, print conversion in British Pounds',
      ],
    },
  ],
  tryItOutSection: ['Click on Save.', 'Click on Run.'],
  challengeSection: [
    {
      name: 'Options Menu',
      task: 'Show options menu as follows:\n\tCurrency Conversion App\n\t1 - US Dollar\n\t2 - British Pound\n\t3 - Euro',
      hintCode: 'System.out.println("Testing something with something yes");',
    },
    {
      name: 'Add new currencies',
      task: 'Add 3 new currencies, ‘NZ Dollar’, ‘Japanese Yen’, ‘Chinese Yuan’\n\nHint: Use www.xe.com to find the conversion rate',
      hintCode: null,
    },
    {
      name: 'Options Check',
      task: "If user enters number other than 1 to 4, show message 'Wrong choice'",
      hintCode: null,
    },
  ],
  newProject: {
    name: 'Bingo!',
    task: 'Generate a list of 10 random numbers (between 1 and 100). Ask the player to guess a number. Check if the players guess is in the list',
  },
  testYourself: 'https://youtube.com',
  funFact:
    'Lists (aka arrays) let us deal with multiple values of the same kind by using only one variable!',
};

export const sampleJavaL5RandomnessRollDice: Lesson = {
  lessonType: 'text-based (programming) lesson',
  topic: 'Randomness',
  project: 'Roll Dice',
  description:
    'The term random refers to any collection of data or information with no determined order, or is chosen in a way that is unknown beforehand.',
  projectExplainer: 'Play 2-player dice roll game with the computer',
  programmingLanguage: 'java',
  getReadySection: ['Get project : Click on “ Code ” and then click save'],
  addYourCodeSection: [
    {
      steps: [
        'Main Program : Check if user input is between 1 – 6. If not, the computer wins. Else, computer randomly rolls the dice',
      ],
      codeBlock:
        'if (ymove < 1 || ymove > 6) {\n    System.out.println("Not possible.. Computer Wins!");\n} else {\n    cmove = (int)((Math.random() * 6) + 1);\n    System.out.println("Computer rolls dice.. " + cmove);\n    //Add IF-ELSE condition to print winner\n}\n\ninput.close();',
    },
    {
      steps: ['Main Program : Add IF-ELSE condition to print winner'],
      codeBlock:
        'if (cmove > ymove) {\n    System.out.println("Computer wins");\n} else if (cmove < ymove){\n    System.out.println("You win");\n}',
    },
  ],
  tryItOutSection: ['Click on Save . Click on Run .'],
  challengeSection: [
    {
      name: '8-sided dice',
      task: 'Instead of a 6-sided dice, play with an 8-sided dice',
      hintCode: null,
    },
    {
      name: 'Deuce',
      task: 'When dice roll is equal of player and computer, print "No winner"',
      hintCode: null,
    },
    {
      name: 'Computer game',
      task: 'Make it a computer vs computer game',
      hintCode: null,
    },
  ],
  newProject: {
    name: 'Spin the wheel',
    task: 'Spin the wheel having numbers between 1-50, 5 times. Print the lowest and largest value',
  },
  funFact:
    'Computing pioneer John von Neumann invented one of the first “arithmetical” computer algorithms for pseudorandom numbers',
  prefaceImageSlots: [
    {
      id: 'preface_img_1',
      base64:
        'data:image/png;base64,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',
    },
  ],
  testYourself: 'https://youtube.com',
};
