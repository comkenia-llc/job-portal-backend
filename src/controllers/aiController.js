const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const CAREER_MARKET_LABEL = process.env.CAREER_MARKET_LABEL || "the target job market";

// ─── helpers ──────────────────────────────────────────────────────────────────

const listToString = (arr, limit = 6) =>
    Array.isArray(arr)
        ? arr.filter(Boolean).slice(0, limit).join(", ")
        : "";

// ─── Resume Summary ───────────────────────────────────────────────────────────

exports.generateResumeSummary = async (req, res) => {
    try {
        const {
            role = "professional",
            industry = "general",
            years,
            keywords = [],
            achievements = [],
            tone = "concise",
        } = req.body || {};

        const yearsStr = years ? `${years} years` : "several years";
        const skillsStr = listToString(keywords, 5);
        const achieveStr = listToString(achievements, 3);

        const prompt = `You are an expert career coach. Write 3 distinct professional summary options for a resume.

Candidate details:
- Role: ${role}
- Industry: ${industry}
- Experience: ${yearsStr}
- Key skills: ${skillsStr || "not specified"}
- Notable achievements: ${achieveStr || "not specified"}
- Tone: ${tone}

Rules:
- Each summary must be 3–4 sentences max
- Be specific, results-oriented, and compelling
- Avoid clichés like "team player", "go-getter", "passionate"
- Tailor language to ${CAREER_MARKET_LABEL} where appropriate
- Return ONLY a JSON array of 3 objects: [{"id":"1","text":"...","tone":"..."},{"id":"2","text":"...","tone":"..."},{"id":"3","text":"...","tone":"..."}]
- No explanation, no markdown, just the raw JSON array`;

        const message = await client.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 800,
            messages: [{ role: "user", content: prompt }],
        });

        const raw = message.content[0]?.text?.trim() || "[]";
        // strip markdown code fences if present
        const jsonStr = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
        const options = JSON.parse(jsonStr);

        res.json({ options, model: "claude-haiku-4-5" });
    } catch (err) {
        console.error("❌ AI resume summary error:", err);
        res.status(500).json({ error: "Failed to generate summary" });
    }
};

// ─── ATS Score Analysis ───────────────────────────────────────────────────────

exports.analyzeAts = async (req, res) => {
    try {
        const { resumeText, jobDescription } = req.body || {};

        if (!resumeText || !jobDescription) {
            return res.status(400).json({ error: "resumeText and jobDescription are required" });
        }

        const prompt = `You are an ATS (Applicant Tracking System) expert. Analyze this resume against the job description.

JOB DESCRIPTION:
${jobDescription.slice(0, 3000)}

RESUME:
${resumeText.slice(0, 3000)}

Return ONLY a JSON object (no markdown, no explanation) in this exact shape:
{
  "score": <integer 0-100>,
  "grade": "<A|B|C|D|F>",
  "summary": "<2-sentence overall verdict>",
  "matched_keywords": ["keyword1", "keyword2"],
  "missing_keywords": ["keyword1", "keyword2"],
  "improvements": [
    {"section": "Summary", "tip": "..."},
    {"section": "Skills", "tip": "..."},
    {"section": "Experience", "tip": "..."}
  ],
  "strengths": ["...", "..."],
  "critical_gaps": ["...", "..."]
}`;

        const message = await client.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1200,
            messages: [{ role: "user", content: prompt }],
        });

        const raw = message.content[0]?.text?.trim() || "{}";
        const jsonStr = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
        const result = JSON.parse(jsonStr);

        res.json(result);
    } catch (err) {
        console.error("❌ ATS analysis error:", err);
        res.status(500).json({ error: "Failed to analyze resume" });
    }
};

// ─── Cover Letter Generator ───────────────────────────────────────────────────

exports.generateCoverLetter = async (req, res) => {
    try {
        const {
            resumeText,
            jobDescription,
            jobTitle,
            companyName,
            candidateName,
            tone = "professional",
        } = req.body || {};

        if (!jobDescription) {
            return res.status(400).json({ error: "jobDescription is required" });
        }

        const prompt = `You are an expert cover letter writer specialising in ${CAREER_MARKET_LABEL}.

Write a compelling cover letter for:
- Candidate: ${candidateName || "the applicant"}
- Role: ${jobTitle || "the position"}
- Company: ${companyName || "the company"}
- Tone: ${tone}

JOB DESCRIPTION:
${jobDescription.slice(0, 2000)}

CANDIDATE RESUME SUMMARY:
${(resumeText || "Not provided").slice(0, 2000)}

Rules:
- 3 paragraphs: hook + value proposition + call-to-action
- Do NOT use "I am writing to apply for" as an opener
- Be specific — reference details from the job description
- Max 300 words
- Return ONLY the cover letter text, no subject line, no address headers`;

        const message = await client.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 600,
            messages: [{ role: "user", content: prompt }],
        });

        const text = message.content[0]?.text?.trim() || "";
        res.json({ text, model: "claude-haiku-4-5" });
    } catch (err) {
        console.error("❌ Cover letter error:", err);
        res.status(500).json({ error: "Failed to generate cover letter" });
    }
};

// ─── Improve Bullet Points ────────────────────────────────────────────────────

exports.improveBullets = async (req, res) => {
    try {
        const { bullets, role, industry } = req.body || {};

        if (!Array.isArray(bullets) || !bullets.length) {
            return res.status(400).json({ error: "bullets array is required" });
        }

        const prompt = `You are a resume writing expert. Rewrite these job experience bullet points to be more impactful using the STAR method (Situation, Task, Action, Result). Start each with a strong action verb. Be quantitative where possible.

Role: ${role || "professional"}
Industry: ${industry || "general"}

Original bullets:
${bullets.map((b, i) => `${i + 1}. ${b}`).join("\n")}

Return ONLY a JSON array of improved bullet strings in the same order as the input. No explanation, no markdown, just the raw JSON array.`;

        const message = await client.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 600,
            messages: [{ role: "user", content: prompt }],
        });

        const raw = message.content[0]?.text?.trim() || "[]";
        const jsonStr = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
        const improved = JSON.parse(jsonStr);

        res.json({ improved, model: "claude-haiku-4-5" });
    } catch (err) {
        console.error("❌ Improve bullets error:", err);
        res.status(500).json({ error: "Failed to improve bullets" });
    }
};
