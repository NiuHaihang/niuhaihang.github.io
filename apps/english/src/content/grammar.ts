import type { GrammarPoint } from './types';

/** 语法点：三年级上册先把 be 动词和 this is 说顺。 */
export const GRAMMAR_POINTS: GrammarPoint[] = [
  {
    id: 'be-verbs',
    grade: 3,
    title: 'am / is / are',
    zh: '我是、你是、他/她是',
    sentences: ['I am a student.', 'You are my friend.', 'He is my teacher.', 'She is Sarah.'],
  },
  {
    id: 'this-is',
    grade: 3,
    title: 'This is …',
    zh: '这是……',
    sentences: ['This is my book.', 'This is my friend.', 'It is a cat.', 'That is a dog.'],
  },
  {
    id: 'greetings',
    grade: 3,
    title: 'Say hello',
    zh: '打招呼',
    sentences: ['Good morning, Miss White.', 'Good afternoon, John.', 'Nice to meet you.', 'Goodbye, Sarah.'],
  },
  {
    id: 'where-is',
    grade: 4,
    title: 'Where is it?',
    zh: '在哪里：in / on / under',
    sentences: [
      'The book is on the desk.',
      'The cat is under the chair.',
      'The pen is in the bag.',
      'My bag is on the table.',
    ],
  },
  {
    id: 'would-like',
    grade: 4,
    title: 'What would you like?',
    zh: '我想要……',
    sentences: [
      'I would like some rice.',
      'Would you like some soup?',
      'I would like a glass of milk.',
      'Here you are.',
    ],
  },
  {
    id: 'these-those',
    grade: 4,
    title: 'These are / Those are',
    zh: '这些是 / 那些是',
    sentences: [
      'These are my books.',
      'Those are his shoes.',
      'These are our desks.',
      'Those are her pencils.',
    ],
  },
  {
    id: 'what-like',
    grade: 5,
    title: "What's he like?",
    zh: '他是什么样的人',
    sentences: [
      'He is tall and thin.',
      'She is quiet and kind.',
      'My teacher is funny.',
      'They are hard-working.',
    ],
  },
  {
    id: 'can-do',
    grade: 5,
    title: 'What can you do?',
    zh: '你会做什么',
    sentences: [
      'I can sing and dance.',
      'I can play football.',
      'She can draw pictures.',
      'Can you swim?',
    ],
  },
  {
    id: 'there-is-are',
    grade: 5,
    title: 'There is / There are',
    zh: '有……',
    sentences: [
      'There is a bed in my room.',
      'There are two windows.',
      'There is a park near my home.',
      'There are many trees.',
    ],
  },
  {
    id: 'how-go',
    grade: 6,
    title: 'How do you go to school?',
    zh: '怎么去学校',
    sentences: [
      'I go to school by bus.',
      'She goes to school on foot.',
      'My father goes to work by car.',
      'How do you come to school?',
    ],
  },
  {
    id: 'past-tense',
    grade: 6,
    title: 'Yesterday',
    zh: '一般过去时',
    sentences: [
      'I went to the park yesterday.',
      'We watched a film last night.',
      'She cleaned her room this morning.',
      'They played football last Sunday.',
    ],
  },
  {
    id: 'taller',
    grade: 6,
    title: 'Taller and taller',
    zh: '比较级',
    sentences: [
      'I am taller than you.',
      'This book is newer than that one.',
      'My bag is heavier than hers.',
      'Who is older?',
    ],
  },
];
