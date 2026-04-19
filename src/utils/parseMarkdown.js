/**
 * parseMarkdown.js — v5.0 Task Markdown Parser
 *
 * Parses task markdown files from the New Item Bank into the TaskData
 * structure required by generateZippyPrompt(taskData).
 */

import matter from 'gray-matter';

/**
 * Parse a task markdown file into a structured TaskData object.
 *
 * @param {string} markdownContent - Raw markdown content of a task file
 * @returns {{
 *   taskTitle: string,
 *   ccssCode: string,
 *   gradeLevel: string,
 *   domain: string,
 *   cluster: string,
 *   standardStatement: string,
 *   filename: string,
 *   studentPrompt: string,
 *   misconceptions: Array<{ id: string, title: string, type: string, description: string }>,
 *   patternRecognition: string,
 *   generalization: string,
 *   inferencePrediction: string,
 *   targetConcepts: string[],
 *   teachingPrompt: string,
 * }}
 */
export function parseTaskMarkdown(markdownContent) {
  if (typeof markdownContent !== 'string' || markdownContent.trim() === '') {
    throw new Error('markdownContent must be a non-empty string');
  }

  const { data: frontmatter, content: body } = matter(markdownContent);

  // Split body into sections by ## N. heading pattern
  const sections = splitSections(body);

  const studentPrompt = extractStudentPrompt(sections['1']);
  const misconceptions = extractMisconceptions(sections['2']);
  const patternRecognition = extractPatternRecognition(sections['3']);
  const generalization = extractGeneralization(sections['4']);
  const inferencePrediction = extractInferencePrediction(sections['5']);
  const targetConcepts = extractTargetConcepts(sections['6']);
  const teachingPrompt = frontmatter.standard_statement || '';

  return {
    taskTitle: frontmatter.task_title || '',
    ccssCode: frontmatter.ccss_code || '',
    gradeLevel: frontmatter.grade_level || '',
    domain: frontmatter.domain || '',
    cluster: frontmatter.cluster || '',
    standardStatement: frontmatter.standard_statement || '',
    filename: frontmatter.filename || '',
    studentPrompt,
    misconceptions,
    patternRecognition,
    generalization,
    inferencePrediction,
    targetConcepts,
    teachingPrompt,
  };
}

/**
 * Split the markdown body into numbered sections keyed by section number.
 * Looks for patterns like "## 1. Student Prompt" or "## 2. Possible Misconceptions"
 */
function splitSections(body) {
  const sectionRegex = /^##\s+(\d+)\.\s+/m;
  const parts = body.split(/(?=^##\s+\d+\.\s+)/m);
  const sections = {};

  for (const part of parts) {
    const match = part.match(sectionRegex);
    if (match) {
      sections[match[1]] = part;
    }
  }

  return sections;
}

/**
 * Extract the student prompt text from section 1.
 */
function extractStudentPrompt(section) {
  if (!section) return '';

  // Remove the section heading and any horizontal rules
  const lines = section
    .replace(/^##\s+\d+\.\s+.*$/m, '')
    .replace(/^---$/gm, '')
    .trim();

  // The student prompt is typically wrapped in quotes
  const quoteMatch = lines.match(/"([^"]+)"/s);
  if (quoteMatch) return quoteMatch[1].trim();

  // Fallback: return the content as-is (stripped of leading/trailing whitespace)
  return lines.trim();
}

/**
 * Extract misconceptions from section 2.
 * Format: 1. **Title** *(Type: type)* Description text
 */
function extractMisconceptions(section) {
  if (!section) return [];

  // Remove section heading
  const content = section.replace(/^##\s+\d+\.\s+.*$/m, '').trim();

  // Match numbered misconception entries
  const misconceptionRegex = /(\d+)\.\s+\*\*([^*]+)\*\*\s*\*\(Type:\s*([^)]+)\)\*\s*(.+?)(?=\n\d+\.\s+\*\*|\n---|\n##|\s*$)/gs;

  const misconceptions = [];
  let match;

  while ((match = misconceptionRegex.exec(content)) !== null) {
    const [, indexStr, title, type, description] = match;
    misconceptions.push({
      id: `M${indexStr}`,
      title: title.trim(),
      type: type.trim(),
      description: description.trim(),
    });
  }

  return misconceptions;
}

/**
 * Extract pattern recognition prompts from section 3.
 * Returns the full content as a single string (multiple prompts joined).
 */
function extractPatternRecognition(section) {
  if (!section) return '';

  const content = section.replace(/^##\s+\d+\.\s+.*$/m, '').replace(/^---$/gm, '').trim();

  // Extract bullet points (lines starting with -)
  const bullets = content
    .split('\n')
    .filter(line => line.trim().startsWith('-'))
    .map(line => line.replace(/^\s*-\s*/, '').replace(/^"(.*)"$/, '$1').trim())
    .filter(Boolean);

  if (bullets.length > 0) return bullets.join('\n');

  // Fallback: return entire content
  return content;
}

/**
 * Extract the generalization question from section 4.
 */
function extractGeneralization(section) {
  if (!section) return '';

  const content = section.replace(/^##\s+\d+\.\s+.*$/m, '').replace(/^---$/gm, '').trim();

  // Look for quoted text
  const quoteMatch = content.match(/"([^"]+)"/s);
  if (quoteMatch) return quoteMatch[1].trim();

  return content.trim();
}

/**
 * Extract the inference/prediction challenge from section 5.
 * Strips the "Prediction target:" annotation.
 */
function extractInferencePrediction(section) {
  if (!section) return '';

  const content = section.replace(/^##\s+\d+\.\s+.*$/m, '').replace(/^---$/gm, '').trim();

  // Remove the prediction target annotation
  const withoutTarget = content.replace(/\*\*Prediction target:\*\*.*$/s, '').trim();

  // Look for quoted text
  const quoteMatch = withoutTarget.match(/"([^"]+)"/s);
  if (quoteMatch) return quoteMatch[1].trim();

  return withoutTarget.trim();
}

/**
 * Extract target concepts (Claims) from section 6.
 */
function extractTargetConcepts(section) {
  if (!section) return [];

  // Find the Claims subsection
  const claimsMatch = section.match(/###\s*Claims\s*\n([\s\S]*?)(?=###|$)/);
  if (!claimsMatch) return [];

  const claims = claimsMatch[1]
    .split('\n')
    .filter(line => line.trim().startsWith('-'))
    .map(line => line.replace(/^\s*-\s*/, '').trim())
    .filter(Boolean);

  return claims;
}

export default parseTaskMarkdown;
