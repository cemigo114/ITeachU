/**
 * Parse an ITeachU task markdown file (.md with YAML front matter).
 *
 * Handles two formats:
 *   Standard (112 files): YAML front matter between --- delimiters, ## N. section headers
 *   Outlier  (1 file):    ### HEADER block with bullet metadata, ### N. section headers
 */
import matter from 'gray-matter';

const SECTION_PATTERNS = [
  { key: 'studentPrompt',      re: /#{2,3}\s*1\.\s*Student\s*Prompt/i },
  { key: 'misconceptions',     re: /#{2,3}\s*2\.\s*(?:Possible\s+)?Misconceptions/i },
  { key: 'patternRecognition', re: /#{2,3}\s*3\.\s*Pattern\s*Recognition\s*Prompt/i },
  { key: 'generalization',     re: /#{2,3}\s*4\.\s*Generalization/i },
  { key: 'inferencePrediction', re: /#{2,3}\s*5\.\s*Inference\s*(?:and|&)\s*Prediction/i },
  { key: 'mappingData',        re: /#{2,3}\s*6\.\s*(?:Mapping|Task\s*Mapping)/i },
];

function findSections(content) {
  const boundaries = [];
  for (const { key, re } of SECTION_PATTERNS) {
    const m = content.match(re);
    if (m) {
      boundaries.push({ key, index: m.index, headerEnd: m.index + m[0].length });
    }
  }
  boundaries.sort((a, b) => a.index - b.index);
  return boundaries;
}

function extractSectionBody(content, boundaries, idx) {
  const start = boundaries[idx].headerEnd;
  const end = idx + 1 < boundaries.length ? boundaries[idx + 1].index : content.length;
  return content.slice(start, end)
    .replace(/^\s*\(Low Entry Point\)/i, '')
    .replace(/^[\s-]*\n/, '')
    .replace(/\n---\s*$/g, '')
    .trim();
}

function parseMisconceptions(raw) {
  const items = [];
  const parts = raw.split(/\n(?=\d+\.\s)/);
  for (const part of parts) {
    const cleaned = part.replace(/^\d+\.\s*/, '').trim();
    if (!cleaned || cleaned.length < 10) continue;

    const titleMatch = cleaned.match(/^\*\*(.+?)\*\*/);
    const typeMatch = cleaned.match(/\*\(Type:\s*(.+?)\)\*/);
    const title = titleMatch ? titleMatch[1] : '';
    const type = typeMatch ? typeMatch[1] : '';

    let description = cleaned;
    if (titleMatch) description = description.replace(/^\*\*(.+?)\*\*\s*/, '');
    if (typeMatch) description = description.replace(/\*\(Type:\s*.+?\)\*\s*/, '');
    description = description.trim();

    items.push({ title, type, description });
  }
  return items.length ? items : [{ title: '', type: '', description: raw.trim() }];
}

function parseMappingData(raw) {
  const result = { claims: [], evidence: '', criticalThinking: '' };

  const claimsRe = /(?:#{1,3}\s*Claims|[\*_]{2}Claims:?[\*_]{2}:?)\s*\n([\s\S]*?)(?=(?:#{1,3}\s*Evidence|[\*_]{2}Evidence:?[\*_]{2})|$)/i;
  const claimsMatch = raw.match(claimsRe);
  if (claimsMatch) {
    result.claims = claimsMatch[1]
      .split('\n')
      .map(l => l.replace(/^[-*]\s*/, '').trim())
      .filter(l => l.length > 5);
  }

  const evidenceRe = /(?:#{1,3}\s*Evidence|[\*_]{2}Evidence:?[\*_]{2}:?)\s*\n([\s\S]*?)(?=(?:#{1,3}\s*Process\s*Data|[\*_]{2}Process\s*Data)|$)/i;
  const evidenceMatch = raw.match(evidenceRe);
  if (evidenceMatch) {
    result.evidence = evidenceMatch[1].trim();
  }

  const processRe = /(?:#{1,3}\s*Process\s*Data\s*Revealing\s*Critical\s*Thinking|[\*_]{2}Process\s*Data\s*Revealing\s*Critical\s*Thinking:?[\*_]{2}:?)\s*\n([\s\S]*?)$/i;
  const processMatch = raw.match(processRe);
  if (processMatch) {
    result.criticalThinking = processMatch[1].replace(/\n---\s*$/, '').trim();
  }

  return result;
}

/**
 * Parse the outlier format (### HEADER with bullet metadata).
 */
function parseOutlierHeader(content) {
  const meta = {};
  const displayMatch = content.match(/-\s*Display:\s*\[(.+?)\]\s*\[(.+?)\]\s*\[(.+?)\]/);
  if (displayMatch) {
    meta.ccss_code = displayMatch[1].trim();
    meta.grade_level = displayMatch[2].trim();
    meta.domain = displayMatch[3].replace(/:.+/, '').trim();
    meta.cluster = displayMatch[3].includes(':') ? displayMatch[3].split(':').pop().trim() : '';
  }
  const titleMatch = content.match(/-\s*Title:\s*"(.+?)"/);
  if (titleMatch) meta.task_title = titleMatch[1];
  const subtitleMatch = content.match(/-\s*Italic subtitle:\s*(.+?)(?=\n|$)/);
  if (subtitleMatch) meta.standard_statement = subtitleMatch[1].trim();
  return meta;
}

/**
 * Parse a markdown task file and return normalized structured data.
 * @param {string} markdownContent - Raw markdown string
 * @param {string} [filename] - Original filename for source tracking
 * @returns {Object} Parsed task data
 */
export function parseMarkdown(markdownContent, filename) {
  let meta, content;

  const isOutlier = !markdownContent.trimStart().startsWith('---');

  if (isOutlier) {
    meta = parseOutlierHeader(markdownContent);
    content = markdownContent;
  } else {
    // Strip citation artifacts that break YAML parsing (e.g. [cite_start], [cite: N])
    const sanitized = markdownContent.replace(/\[cite_start\]/g, '').replace(/\[cite:\s*[\d,\s]+\]/g, '');
    const parsed = matter(sanitized);
    meta = parsed.data;
    content = parsed.content;
  }

  const boundaries = findSections(content);
  const sections = {};
  for (let i = 0; i < boundaries.length; i++) {
    const body = extractSectionBody(content, boundaries, i);
    sections[boundaries[i].key] = body;
  }

  return {
    ccssCode: meta.ccss_code || '',
    gradeLevel: meta.grade_level || '',
    domain: meta.domain || '',
    cluster: meta.cluster || '',
    standardStatement: meta.standard_statement || '',
    taskTitle: meta.task_title || '',
    filename: filename || meta.filename || '',

    studentPrompt: sections.studentPrompt || '',
    misconceptions: sections.misconceptions ? parseMisconceptions(sections.misconceptions) : [],
    patternRecognition: sections.patternRecognition || '',
    generalization: sections.generalization || '',
    inferencePrediction: sections.inferencePrediction || '',
    mappingData: sections.mappingData ? parseMappingData(sections.mappingData) : { claims: [], evidence: '', criticalThinking: '' },
  };
}

export default parseMarkdown;
