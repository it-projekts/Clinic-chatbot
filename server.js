const express = require('express');
const cors = require('cors');
const Fuse = require('fuse.js');
const faqs = require('./faqs.json');

const app = express();
app.use(cors());
app.use(express.json());

// Fuzzy search as a fallback, for typos and rephrasings
const fuse = new Fuse(faqs, {
  keys: [
    { name: 'question', weight: 0.4 },
    { name: 'keywords', weight: 0.6 }
  ],
  threshold: 0.4,
  ignoreLocation: true
});

function findAnswer(userQuestion) {
  const lowerQ = userQuestion.toLowerCase();

  // 1. Direct phrase matching first — catches keywords appearing anywhere in the sentence
  for (const faq of faqs) {
    const allPhrases = [faq.question, ...(faq.keywords || [])];
    for (const phrase of allPhrases) {
      if (lowerQ.includes(phrase.toLowerCase())) {
        return faq.answer;
      }
    }
  }

  // 2. Fuzzy fallback — catches typos and rewordings the direct check misses
  const results = fuse.search(userQuestion);
  if (results.length > 0) {
    return results[0].item.answer;
  }

  return null;
}

app.post('/ask', (req, res) => {
  const userQuestion = req.body.question || '';
  const answer = findAnswer(userQuestion);

  if (answer) {
    res.json({ answer, matched: true });
  } else {
    res.json({
      answer: "I'm not sure about that — please ask a member of staff at the front desk.",
      matched: false
    });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});