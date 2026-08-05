const GovernmentJob = require('../models/GovernmentJob');

const JOB_TYPES = ['Govt Jobs', 'PSU Jobs', 'Semi Govt Jobs', 'MSME Jobs'];

const DISCOVERY_PROMPT = `Search the web for CURRENTLY OPEN Indian government job recruitment notifications
(Central government, State government, PSU, and semi-government) whose application deadline has not
yet passed. Only include real, verifiable postings with a genuine official application link — never
invent or guess a posting, deadline, or link.
For each, return: job title, hiring organization, last date to apply (as an ISO 8601 date, e.g. 2026-03-15),
the direct official application/notification URL, the job category (one of "Govt Jobs", "PSU Jobs",
"Semi Govt Jobs", "MSME Jobs"), the level ("Central" or "State"), and if State-level, the Indian state name.
Return ONLY a raw JSON array (no markdown, no commentary) of objects with keys:
jobTitle, organizationName, lastDateToApply, applyLink, jobType, level, state.
Limit to at most 25 postings. If you cannot verify a real posting, omit it rather than guessing.`;

function extractResponseText(data) {
  if (data.output_text) return data.output_text;
  if (Array.isArray(data.output)) {
    return data.output
      .flatMap((item) => item.content || [])
      .filter((c) => c.type === 'output_text')
      .map((c) => c.text)
      .join('\n');
  }
  return '';
}

function stripCodeFence(text) {
  return text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
}

/**
 * Uses OpenAI's web-search-enabled Responses API to discover open government
 * job postings and upserts them directly into the DB — no admin review step.
 * Expired, unparseable, or incomplete postings are skipped.
 */
async function fetchGovernmentJobsFromWeb() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not defined in the environment variables.');
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-search-preview',
      tools: [{ type: 'web_search_preview' }],
      input: DISCOVERY_PROMPT
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'OpenAI web search request failed');
  }

  const text = extractResponseText(data);
  let postings;
  try {
    postings = JSON.parse(stripCodeFence(text));
  } catch (err) {
    throw new Error('Failed to parse job postings from AI response: ' + err.message);
  }

  if (!Array.isArray(postings)) {
    return { inserted: 0, skipped: 0, totalFound: 0 };
  }

  const now = new Date();
  let inserted = 0;
  let skipped = 0;

  for (const posting of postings) {
    try {
      const lastDate = new Date(posting.lastDateToApply);
      if (
        !posting.jobTitle ||
        !posting.organizationName ||
        !posting.applyLink ||
        isNaN(lastDate.getTime()) ||
        lastDate <= now
      ) {
        skipped++;
        continue;
      }

      const jobType = JOB_TYPES.includes(posting.jobType) ? posting.jobType : 'Govt Jobs';
      const level = posting.level === 'State' ? 'State' : 'Central';

      const result = await GovernmentJob.updateOne(
        {
          jobTitle: posting.jobTitle,
          organizationName: posting.organizationName,
          applyLink: posting.applyLink
        },
        {
          $setOnInsert: {
            jobTitle: posting.jobTitle,
            organizationName: posting.organizationName,
            lastDateToApply: lastDate,
            applyLink: posting.applyLink,
            jobType,
            level,
            state: level === 'State' ? (posting.state || '') : '',
            isAdmin: true,
            source: 'auto'
          }
        },
        { upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );

      if (result.upsertedCount > 0) inserted++;
    } catch (err) {
      skipped++;
    }
  }

  return { inserted, skipped, totalFound: postings.length };
}

module.exports = { fetchGovernmentJobsFromWeb };
