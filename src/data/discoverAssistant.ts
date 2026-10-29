/**
 * Longevity AI assistant — suggestion chips and canned answers.
 * The first answer is the text captured on device (assistant/answer_top + answered);
 * the others are placeholders written in the same voice.
 */

/** A rich answer block: paragraph or numbered list; `**x**` marks bold runs. */
export type AnswerBlock = { p: string } | { ol: string[] };

export const SUGGESTIONS = [
  "Which genes influence my long-term health?",
  "Do my genetics increase certain health risks?",
  "What can my DNA tell me about aging and longevity?",
  "How do my genetic variants affect my daily wellness?",
] as const;

const GENES_ANSWER: AnswerBlock[] = [
  { p: "Your genetic data reveals several genes that influence your long-term health. Here are a few notable ones:" },
  {
    ol: [
      "**PEX5 Gene**: Associated with Peroxisome Biogenesis Disorder 2A (Zellweger), which can lead to a wide range of health issues due to defective peroxisome function. Although your classification is benign, managing this condition involves regular health assessments and a comprehensive lifestyle approach.",
      "**SRP54 Gene**: This gene is linked to severe congenital neutropenia type 8, affecting the body's ability to produce certain white blood cells. Lifestyle modifications and regular assessments can play a significant role in managing this condition.",
      "**SMAD3 Gene**: Related to Aneurysm-Osteoarthritis syndrome, a hereditary condition involving aneurysms and osteoarthritis. Effective management includes regular medical check-ups and a tailored exercise routine.",
    ],
  },
  {
    p: "Remember, these genetic findings offer insights into predispositions, but they’re not definitive predictors of your health outcomes. It’s important to discuss any concerns with a healthcare provider to explore personalized prevention and management strategies. If you'd like more information on other genes or conditions, let me know!",
  },
];

// TODO(fidelity): only the first suggestion's answer was captured; the rest are placeholders.
const GENERIC_ANSWER: AnswerBlock[] = [
  { p: "Based on your genetic report, a few variants are worth keeping an eye on. None of them are definitive predictors of disease, but they can guide prevention." },
  {
    p: "Regular check-ups, a balanced diet, good sleep and consistent exercise remain the most effective ways to support long-term health. If you'd like more detail on a specific gene, let me know!",
  },
];

export function answerFor(question: string): AnswerBlock[] {
  return question.trim() === SUGGESTIONS[0] ? GENES_ANSWER : GENERIC_ANSWER;
}

/** Typing-dots duration before the whole answer appears (assistant/typing note: ~4 s, no streaming). */
export const TYPING_MS = 4000;
