/**
 * Parse an ITeachU task .docx file and extract all 6 sections.
 *
 * Expected layout:
 *   Title line:  "X.YY.Z.N Math Task: <Title>"
 *   Standard:    "Standard: X.YY.Z.N - <description>"
 *   Section 1:   Student Prompt (Low Entry Point)
 *   Section 2:   Possible Misconceptions
 *   Section 3:   Pattern Recognition Prompt
 *   Section 4:   Generalization Question
 *   Section 5:   Inference and Prediction
 *   Section 6:   Mapping and Process Data
 */
import JSZip from 'jszip';
import fs from 'fs';

const SECTION_HEADERS = [
  { key: 'studentPrompt',      patterns: [/1\.\s*Student[- ]?(?:Facing\s+)?Prompt/i, /1\.\s*The Initial Challenge/i] },
  { key: 'misconceptions',     patterns: [/2\.\s*(?:Possible |Built-in |Potential )?Misconceptions/i] },
  { key: 'patternRecognition', patterns: [/3\.\s*Pattern(?:\s*\/\s*Similarity|\s+Recognition)\s*Prompt/i, /3\.\s*Noticing Patterns/i] },
  { key: 'generalization',     patterns: [/4\.\s*Generalization/i] },
  { key: 'inferencePrediction', patterns: [/5\.\s*(?:Inference\s*(?:and|or|\/)\s*Prediction|New Case Prediction)/i] },
  { key: 'mappingData',        patterns: [/6\.\s*(?:Mapping|Task Mapping)/i] },
];

function extractText(xmlStr) {
  return xmlStr
    .replace(/<w:p[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\r/g, '')
    .split('\n')
    .map(l => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

function findSectionBoundaries(text) {
  const boundaries = [];
  for (const { key, patterns } of SECTION_HEADERS) {
    for (const re of patterns) {
      const m = text.match(re);
      if (m) {
        boundaries.push({ key, index: m.index, headerEnd: m.index + m[0].length });
        break;
      }
    }
  }
  boundaries.sort((a, b) => a.index - b.index);
  return boundaries;
}

function sliceSectionBody(text, boundaries, idx) {
  const start = boundaries[idx].headerEnd;
  const end = idx + 1 < boundaries.length ? boundaries[idx + 1].index : text.length;
  let body = text.slice(start, end).trim();
  // Strip residual sub-header text that follows the numbered header
  body = body.replace(/^\s*\(Low Entry Point\)\s*/i, '');
  body = body.replace(/^\s*Question\s*/i, '');
  body = body.replace(/^\s*Prompt\s*/i, '');
  return body.trim();
}

function parseMisconceptions(raw) {
  const items = [];
  const parts = raw.split(/\n(?=\d+\.\s)/);
  for (const part of parts) {
    const cleaned = part.replace(/^\d+\.\s*/, '').trim();
    if (cleaned && cleaned.length > 10) items.push(cleaned);
  }
  return items.length ? items : [raw.trim()];
}

function parseMappingData(raw) {
  const result = { claims: [], evidence: [], criticalThinking: '' };
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

  let inProcessData = false;
  const processLines = [];

  for (const line of lines) {
    if (/process data revealing/i.test(line)) {
      inProcessData = true;
      continue;
    }
    if (inProcessData) {
      const cleaned = line.replace(/^[-•]\s*/, '').trim();
      if (cleaned) processLines.push(cleaned);
    }
  }

  result.criticalThinking = processLines.join(' ');

  const claimSection = raw.match(/Claim[\s\S]*?(?=Process Data|$)/i);
  if (claimSection) {
    const claimLines = claimSection[0].split('\n').map(l => l.trim()).filter(Boolean);
    for (const cl of claimLines) {
      if (cl.toLowerCase().startsWith('claim') || cl.toLowerCase().startsWith('evidence') || cl.toLowerCase().startsWith('task feature')) continue;
      if (cl.length > 15 && !cl.includes('→')) {
        result.claims.push(cl);
      }
    }
  }

  return result;
}

/**
 * Parse a .docx file and return structured task data.
 * @param {string|Buffer} docxPathOrBuffer
 * @returns {Promise<Object>}
 */
export async function parseDocx(docxPathOrBuffer) {
  const buf = typeof docxPathOrBuffer === 'string'
    ? fs.readFileSync(docxPathOrBuffer)
    : docxPathOrBuffer;

  const zip = await JSZip.loadAsync(buf);
  const doc = zip.file('word/document.xml');
  if (!doc) throw new Error('word/document.xml not found');

  const xmlStr = await doc.async('string');
  const fullText = extractText(xmlStr);

  const result = { fullText };

  const titleMatch = fullText.match(/(?:Math Task|Math Assessment Task|Low-Floor,?\s*High-Ceiling Task):\s*(.+?)(?=\n|Standard:)/);
  if (titleMatch) {
    result.title = titleMatch[1].trim();
  } else {
    // Try first non-empty line as title if it looks like a title (no section number prefix)
    const firstLine = fullText.split('\n').find(l => l.trim() && !/^\d+\.\s/.test(l.trim()));
    if (firstLine && firstLine.trim().length < 120 && !/Standard:/i.test(firstLine)) {
      result.title = firstLine.trim().replace(/^[\d.]+\s*[A-Z]+\.[A-Z]\.\d+\s*/, '');
    }
  }
  result.title = result.title || null;

  const standardMatch = fullText.match(/Standard:\s*([^\s]+)\s*-\s*(.+?)(?=\n\d\.|$)/s);
  if (standardMatch) {
    result.standardCode = standardMatch[1].trim();
    result.standardDescription = standardMatch[2].trim();
  }

  const boundaries = findSectionBoundaries(fullText);

  for (let i = 0; i < boundaries.length; i++) {
    const { key } = boundaries[i];
    const body = sliceSectionBody(fullText, boundaries, i);

    switch (key) {
      case 'studentPrompt':
        result.studentPrompt = body;
        break;
      case 'misconceptions':
        result.misconceptions = parseMisconceptions(body);
        break;
      case 'patternRecognition':
        result.patternRecognition = body;
        break;
      case 'generalization':
        result.generalization = body;
        break;
      case 'inferencePrediction':
        result.inferencePrediction = body;
        break;
      case 'mappingData':
        result.mappingData = parseMappingData(body);
        break;
    }
  }

  return result;
}

export default parseDocx;
