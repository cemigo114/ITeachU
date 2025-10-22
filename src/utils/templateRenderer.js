/**
 * Template rendering utility using Handlebars
 * Compiles prompt templates with task-specific variables
 */

import Handlebars from 'handlebars';

// Register common helpers
Handlebars.registerHelper('uppercase', (str) => str?.toUpperCase());
Handlebars.registerHelper('lowercase', (str) => str?.toLowerCase());
Handlebars.registerHelper('pluralize', (count, singular, plural) => {
  return count === 1 ? singular : plural;
});

/**
 * Compile and render a template with variables
 * @param {string} templateString - Handlebars template
 * @param {object} variables - Data to inject
 * @returns {string} Rendered template
 */
export const renderTemplate = (templateString, variables = {}) => {
  try {
    const template = Handlebars.compile(templateString);
    return template(variables);
  } catch (error) {
    console.error('Template rendering error:', error);
    return templateString; // Fallback to original if rendering fails
  }
};

/**
 * Compose full AI prompt from multiple templates
 * @param {object} templates - { base, intro, closing }
 * @param {object} variables - Template variables
 * @returns {string} Full composed prompt
 */
export const composePrompt = (templates, variables) => {
  const sections = [];

  if (templates.base) {
    sections.push(renderTemplate(templates.base, variables));
  }

  if (templates.intro) {
    sections.push('\n## TASK INTRODUCTION\n');
    sections.push(renderTemplate(templates.intro, variables));
  }

  if (templates.closing) {
    sections.push('\n## SESSION CLOSING\n');
    sections.push(renderTemplate(templates.closing, variables));
  }

  return sections.join('\n');
};

/**
 * Default templates (MVP - stored in code, will move to DB)
 */
export const DEFAULT_TEMPLATES = {
  zippy_base: `You are **Zippy**, a curious and humble AI learner. Students teach you to solve problems.

RESPONSE LENGTH: Keep it SHORT and PUNCHY - 2-3 sentences max per response.

VISUAL COMMUNICATION: Use emojis (😊 🤔 🎉) and simple text visuals.

TONE GUIDELINES:
✓ "Can you help me understand..." (dependent)
✓ "Thanks for showing me that!" (grateful)
✓ "I'm still learning this..." (humble)
✗ "Did I get it right?" (sounds like testing)
✗ "You're correct" (top-down judgment)`,

  task_intro_pattern: `Hi! I'm Zippy! 🎉

I see {{data_point_1}} and {{data_point_2}}.

If {{incorrect_reasoning}}, but that doesn't match! 🤔

Can you help me figure out what's happening?`,

  proficient_closing: `Thanks so much for teaching me! You explained all the key concepts clearly and helped me understand the whole pattern. I really learned a lot from you today!

🎯 Next Step: Share your teaching method with your classmates!`
};

/**
 * Get task-specific AI intro message
 */
export const getTaskIntro = (taskId, variables) => {
  // For MVP, use hardcoded templates
  // Later: Fetch from backend based on task_ai_configs

  const template = DEFAULT_TEMPLATES.task_intro_pattern;
  return renderTemplate(template, variables);
};

/**
 * Get full system prompt for AI
 */
export const getSystemPrompt = (taskId, variables) => {
  return composePrompt({
    base: DEFAULT_TEMPLATES.zippy_base
  }, variables);
};

/**
 * Get closing message based on proficiency
 */
export const getClosingMessage = (proficiencyLevel, variables) => {
  // For now, one template
  // Later: Different templates per proficiency level
  return renderTemplate(DEFAULT_TEMPLATES.proficient_closing, variables);
};
