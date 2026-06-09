const fs = require('fs');
const path = require('path');

const DUMP_PATH = process.argv[2];
const OUT_PATH = process.argv[3] || path.join(__dirname, '..', '..', '..', 'data', 'company-category-faqs.json');

if (!DUMP_PATH) {
  console.error('Usage: node generateCompanyCategoryFaqsFromDump.js /path/to/CompanyCategories.sql [output.json]');
  process.exit(1);
}

const sql = fs.readFileSync(DUMP_PATH, 'utf8');

function extractInsertChunks(sqlText) {
  const re = /INSERT INTO `CompanyCategories`/g;
  const indices = [];
  let m;
  while ((m = re.exec(sqlText))) indices.push(m.index);
  indices.push(sqlText.length);
  const chunks = [];
  for (let i = 0; i < indices.length - 1; i += 1) {
    chunks.push(sqlText.slice(indices[i], indices[i + 1]));
  }
  return chunks;
}

function parseValuesTuples(valuesText) {
  const tuples = [];
  let i = 0;
  const len = valuesText.length;

  while (i < len) {
    while (i < len && valuesText[i] !== '(') i += 1;
    if (i >= len) break;
    i += 1; // skip '('

    const fields = [];
    let field = '';
    let inSingle = false;
    let inDouble = false;

    while (i < len) {
      const ch = valuesText[i];
      const prev = i > 0 ? valuesText[i - 1] : '';
      const next = i + 1 < len ? valuesText[i + 1] : '';

      if (inSingle && ch === "'" && next === "'") {
        field += "''";
        i += 2;
        continue;
      }
      if (inDouble && ch === '\"' && next === '\"') {
        field += '\"\"';
        i += 2;
        continue;
      }

      if (ch === "'" && !inDouble && prev !== '\\') {
        inSingle = !inSingle;
        field += ch;
        i += 1;
        continue;
      }
      if (ch === '"' && !inSingle && prev !== '\\') {
        inDouble = !inDouble;
        field += ch;
        i += 1;
        continue;
      }

      if (!inSingle && !inDouble) {
        if (ch === ',') {
          fields.push(field.trim());
          field = '';
          i += 1;
          continue;
        }
        if (ch === ')') {
          fields.push(field.trim());
          field = '';
          i += 1;
          break;
        }
      }

      field += ch;
      i += 1;
    }

    if (fields.length) tuples.push(fields);
  }
  return tuples;
}

function unquote(value) {
  if (value === null || value === undefined) return null;
  const v = value.trim();
  if (v.toUpperCase() === 'NULL') return null;
  if (v.startsWith("'") && v.endsWith("'")) {
    const inner = v.slice(1, -1);
    return inner
      .replace(/''/g, "'")
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, "\\");
  }
  if (v.startsWith('"') && v.endsWith('"')) {
    const inner = v.slice(1, -1);
    return inner
      .replace(/\"\"/g, '"')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }
  return v;
}

const chunks = extractInsertChunks(sql);
const rows = [];

for (const chunk of chunks) {
  const m = chunk.match(/VALUES\s*(.*)$/is);
  if (!m) continue;
  const valuesText = m[1].trim();
  const tuples = parseValuesTuples(valuesText);
  for (const tuple of tuples) {
    if (tuple.length < 7) continue;
    const id = Number(unquote(tuple[0]));
    const name = unquote(tuple[1]);
    const slug = unquote(tuple[2]);
    const parentIdRaw = tuple[5];
    const parentId = parentIdRaw ? Number(unquote(parentIdRaw)) : null;
    rows.push({ id, name, slug, parentId: Number.isNaN(parentId) ? null : parentId });
  }
}

const template = {
  q: {
    1: 'How to find {name} companies in Dubai?',
    2: 'Which {name} companies are hiring in Dubai now?',
    3: 'What jobs are common in {name} companies?',
    4: 'How to apply to {name} companies in Dubai?',
    5: 'Are {name} companies good for freshers in Dubai?',
    6: 'What skills do {name} companies look for?',
    7: 'What is the salary range in {name} companies in Dubai?',
    8: 'How to get interviews with {name} companies?',
    9: 'What are the requirements to work in {name} companies in Dubai?',
    10: 'How to apply for {name} companies on Dubai Job Zone?'
  }
};

function makeFaqs(name) {
  const faqs = [];
  faqs.push({
    q: template.q[1].replace('{name}', name),
    a: `Start by shortlisting companies in ${name} and matching your CV to the roles they post. Focus on measurable results and tools used so recruiters can quickly see fit. Use Dubai Job Zone to compare openings and apply early.`
  });
  faqs.push({
    q: template.q[2].replace('{name}', name),
    a: `Hiring in ${name} changes weekly based on projects and budgets. Track new listings, set alerts, and apply within the first few days for better response rates. Companies often prioritize candidates who meet core requirements exactly.`
  });
  faqs.push({
    q: template.q[3].replace('{name}', name),
    a: `${name} companies typically hire across core operations, specialist roles, and support functions. The exact mix depends on company size and service model. Review recent job posts to see the most common titles.`
  });
  faqs.push({
    q: template.q[4].replace('{name}', name),
    a: `Apply through official company career pages or trusted job platforms. Tailor your CV for each role and highlight relevant achievements. A focused cover note can improve shortlisting rates.`
  });
  faqs.push({
    q: template.q[5].replace('{name}', name),
    a: `Many ${name} companies offer entry-level roles, internships, or trainee programs. Freshers who show practical skills and clear communication often get interviews. Build a small portfolio or case examples if possible.`
  });
  faqs.push({
    q: template.q[6].replace('{name}', name),
    a: `Employers look for job-specific technical skills plus teamwork and reliability. Show tools you’ve used and results you delivered. Strong communication and problem-solving are consistently valued in Dubai.`
  });
  faqs.push({
    q: template.q[7].replace('{name}', name),
    a: `Salaries vary by seniority, employer type, and specialization. Roles with niche expertise or leadership scope usually pay more. Always compare total package benefits like housing, transport, and visa support.`
  });
  faqs.push({
    q: template.q[8].replace('{name}', name),
    a: `Optimize your CV keywords to match job descriptions and keep profiles updated. Apply quickly and follow up politely after submitting. Networking with hiring managers or recruiters can also help.`
  });
  faqs.push({
    q: template.q[9].replace('{name}', name),
    a: `Requirements depend on the role and seniority, but most ask for relevant education or experience. Regulated roles may need licenses or approvals. Read each job post carefully for visa and compliance details.`
  });
  faqs.push({
    q: template.q[10].replace('{name}', name),
    a: `Use the company category filters to narrow down relevant employers, then apply directly to matching roles. Keep your profile complete and highlight measurable outcomes. Set alerts to catch new postings fast.`
  });
  return faqs;
}

const jobCategories = rows
  .filter((row) => row && row.slug && row.name)
  .map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    parentId: row.parentId ?? null,
    faqs: makeFaqs(row.name)
  }));

const payload = { companyCategories: jobCategories };

fs.writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2));

console.log(`Parsed rows: ${rows.length}`);
console.log(`Written categories: ${jobCategories.length}`);
console.log(`Output: ${OUT_PATH}`);
