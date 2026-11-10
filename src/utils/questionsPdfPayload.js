// Builds the ordered topic/question list sent to POST /api/subjects/:slug/questions-pdf for one
// unit. Walks the paper node exactly the way the book's "Generate" does when it builds
// includedQuestionIds — topics in on-screen order, each topic's items in on-screen order,
// keeping user-inserted title pages (as sub-topic headings) — so with onlyIncluded the
// questions come out in precisely the order the compiled book prints them.
export function buildQuestionsPdfTopics(paperNode, includedQuestions, onlyIncluded) {
  return paperNode.topics.map((t) => ({
    title: t.title,
    items: t.questions
      .filter((q) => q.isTitlePage || !onlyIncluded || includedQuestions.has(q._id))
      .map((q) => (q.isTitlePage
        ? { type: "subtopic", text: q.subtitle || q.question_text || "" }
        : { type: "question", id: q._id, text: q.question_text || "" })),
  }));
}
