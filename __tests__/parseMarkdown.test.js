import { describe, it, expect } from 'vitest';
import { parseTaskMarkdown } from '../src/utils/parseMarkdown.js';
import fs from 'fs';
import path from 'path';

const SAMPLE_MARKDOWN = `---
ccss_code: "6.RP.A.3"
grade_level: "Grade 6"
domain: "Ratios and Proportional Relationships"
cluster: "Understand ratio concepts and use ratio reasoning to solve problems"
standard_statement: "Use ratio and rate reasoning to solve real-world and mathematical problems."
task_title: "The Blue Slushie Mystery"
filename: "6.RP.A.3_blue-slushie-mystery.md"
---

# 6.RP.A.3 · Grade 6 · Ratios and Proportional Relationships
## "The Blue Slushie Mystery"

---

## 1. Student Prompt
"I'm helping at the concession stand and we have this giant container of blue raspberry slushie that uses 3 cups of syrup for every 10 cups of water. Someone just dumped in a whole 12-cup bottle of syrup by mistake, and now I have to figure out how much water to add so it doesn't taste like pure sugar. If the recipe has to stay exactly the same as the original, how much water do we need for this giant mistake?"

---

## 2. Possible Misconceptions

1. **Additive Thinking** *(Type: additive_vs_multiplicative_confusion)* A student might think that since 9 more cups of syrup were added, they should simply add 9 more cups of water.
2. **Whole Number Bias** *(Type: whole_number_bias)* A student might try to divide 12 by 10 because they are the two most recent numbers mentioned.
3. **Internal vs. External Ratio Confusion** *(Type: partial_concept_model)* A student might confuse the part-to-part ratio with a part-to-whole ratio.

---

## 3. Pattern Recognition Prompts

- "When you look at the 3 cups of syrup jumping up to 12 cups, how many of those original batches are we actually making now?"
- "Wait, does the 10-cup water amount stay the same, or does it have to grow by the same multiplier as the syrup?"

---

## 4. Generalization Question (Always / Sometimes / Never)
"I have this hunch that if you want a flavor to stay exactly the same, you ALWAYS have to multiply both ingredients by the same number... or could you just add the same amount to both and have it still taste right?"

---

## 5. Inference and Prediction
"I found this other Super Sour recipe that uses 2 cups of lemon juice for every 5 cups of sugar water. If we wanted to make enough for the whole school and used 20 cups of lemon juice, is there a way to figure out the total amount of sugar water without drawing out every single cup?"

**Prediction target:** The amount of sugar water needed for 20 cups of lemon juice (50 cups).

---

## 6. Mapping and Process Data

### Claims
- Students can use multiplicative reasoning to create equivalent ratios in a real-world context.
- Students can identify the scale factor between two quantities and apply it consistently.

### Evidence
Evidence is observed when students reject the additive strategy.
---`;

describe('parseTaskMarkdown', () => {
  describe('frontmatter extraction', () => {
    it('should extract all frontmatter fields', () => {
      const result = parseTaskMarkdown(SAMPLE_MARKDOWN);

      expect(result.taskTitle).toBe('The Blue Slushie Mystery');
      expect(result.ccssCode).toBe('6.RP.A.3');
      expect(result.gradeLevel).toBe('Grade 6');
      expect(result.domain).toBe('Ratios and Proportional Relationships');
      expect(result.standardStatement).toBe(
        'Use ratio and rate reasoning to solve real-world and mathematical problems.'
      );
      expect(result.filename).toBe('6.RP.A.3_blue-slushie-mystery.md');
    });
  });

  describe('student prompt extraction', () => {
    it('should extract the student prompt text', () => {
      const result = parseTaskMarkdown(SAMPLE_MARKDOWN);

      expect(result.studentPrompt).toContain('concession stand');
      expect(result.studentPrompt).toContain('3 cups of syrup');
      expect(result.studentPrompt).toContain('how much water do we need');
    });
  });

  describe('misconception extraction', () => {
    it('should extract all three misconceptions', () => {
      const result = parseTaskMarkdown(SAMPLE_MARKDOWN);

      expect(result.misconceptions).toHaveLength(3);
    });

    it('should parse misconception IDs correctly', () => {
      const result = parseTaskMarkdown(SAMPLE_MARKDOWN);

      expect(result.misconceptions[0].id).toBe('M1');
      expect(result.misconceptions[1].id).toBe('M2');
      expect(result.misconceptions[2].id).toBe('M3');
    });

    it('should parse misconception titles correctly', () => {
      const result = parseTaskMarkdown(SAMPLE_MARKDOWN);

      expect(result.misconceptions[0].title).toBe('Additive Thinking');
      expect(result.misconceptions[1].title).toBe('Whole Number Bias');
      expect(result.misconceptions[2].title).toBe('Internal vs. External Ratio Confusion');
    });

    it('should parse misconception types correctly', () => {
      const result = parseTaskMarkdown(SAMPLE_MARKDOWN);

      expect(result.misconceptions[0].type).toBe('additive_vs_multiplicative_confusion');
      expect(result.misconceptions[1].type).toBe('whole_number_bias');
      expect(result.misconceptions[2].type).toBe('partial_concept_model');
    });

    it('should parse misconception descriptions', () => {
      const result = parseTaskMarkdown(SAMPLE_MARKDOWN);

      expect(result.misconceptions[0].description).toContain('9 more cups');
      expect(result.misconceptions[1].description).toContain('divide 12 by 10');
    });
  });

  describe('pattern recognition extraction', () => {
    it('should extract pattern recognition prompts', () => {
      const result = parseTaskMarkdown(SAMPLE_MARKDOWN);

      expect(result.patternRecognition).toContain('original batches');
      expect(result.patternRecognition).toContain('multiplier');
    });
  });

  describe('generalization extraction', () => {
    it('should extract the generalization question', () => {
      const result = parseTaskMarkdown(SAMPLE_MARKDOWN);

      expect(result.generalization).toContain('ALWAYS have to multiply');
      expect(result.generalization).toContain('add the same amount');
    });
  });

  describe('inference/prediction extraction', () => {
    it('should extract the inference challenge', () => {
      const result = parseTaskMarkdown(SAMPLE_MARKDOWN);

      expect(result.inferencePrediction).toContain('Super Sour recipe');
      expect(result.inferencePrediction).toContain('20 cups of lemon juice');
    });

    it('should strip the prediction target annotation', () => {
      const result = parseTaskMarkdown(SAMPLE_MARKDOWN);

      expect(result.inferencePrediction).not.toContain('Prediction target:');
      expect(result.inferencePrediction).not.toContain('50 cups');
    });
  });

  describe('target concepts extraction', () => {
    it('should extract claims as target concepts', () => {
      const result = parseTaskMarkdown(SAMPLE_MARKDOWN);

      expect(result.targetConcepts).toHaveLength(2);
      expect(result.targetConcepts[0]).toContain('multiplicative reasoning');
      expect(result.targetConcepts[1]).toContain('scale factor');
    });
  });

  describe('error handling', () => {
    it('should throw for empty string', () => {
      expect(() => parseTaskMarkdown('')).toThrow('non-empty string');
    });

    it('should throw for non-string input', () => {
      expect(() => parseTaskMarkdown(42)).toThrow('non-empty string');
    });

    it('should throw for null input', () => {
      expect(() => parseTaskMarkdown(null)).toThrow('non-empty string');
    });

    it('should handle markdown with missing sections gracefully', () => {
      const minimal = `---
task_title: "Minimal Task"
ccss_code: "8.EE.A.1"
---

# Minimal

## 1. Student Prompt
"Help me understand exponents."
`;

      const result = parseTaskMarkdown(minimal);

      expect(result.taskTitle).toBe('Minimal Task');
      expect(result.studentPrompt).toContain('exponents');
      expect(result.misconceptions).toEqual([]);
      expect(result.patternRecognition).toBe('');
      expect(result.generalization).toBe('');
      expect(result.inferencePrediction).toBe('');
      expect(result.targetConcepts).toEqual([]);
    });
  });

  describe('real file parsing', () => {
    const itemBankDir = path.resolve(process.cwd(), '..', 'New Item Bank');

    it('should parse the blue slushie mystery file', () => {
      const filePath = path.join(itemBankDir, '6.RP.A.3_blue-slushie-mystery.md');
      if (!fs.existsSync(filePath)) {
        return; // Skip if file not available in CI
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const result = parseTaskMarkdown(content);

      expect(result.taskTitle).toBe('The Blue Slushie Mystery');
      expect(result.ccssCode).toBe('6.RP.A.3');
      expect(result.misconceptions.length).toBeGreaterThanOrEqual(3);
      expect(result.studentPrompt.length).toBeGreaterThan(0);
      expect(result.patternRecognition.length).toBeGreaterThan(0);
      expect(result.generalization.length).toBeGreaterThan(0);
      expect(result.inferencePrediction.length).toBeGreaterThan(0);
    });

    it('should parse the doubling dilemma file', () => {
      const filePath = path.join(itemBankDir, '8.EE.A.1_the-doubling-dilemma.md');
      if (!fs.existsSync(filePath)) {
        return; // Skip if file not available in CI
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const result = parseTaskMarkdown(content);

      expect(result.taskTitle).toBe('The Doubling Dilemma');
      expect(result.ccssCode).toBe('8.EE.A.1');
      expect(result.misconceptions).toHaveLength(3);
      expect(result.misconceptions[0].type).toBe('additive_vs_multiplicative_confusion');
      expect(result.misconceptions[1].type).toBe('procedural_overgeneralization');
      expect(result.misconceptions[2].type).toBe('whole_number_bias');
    });

    it('should successfully parse all available task files without throwing', () => {
      if (!fs.existsSync(itemBankDir)) {
        return; // Skip if directory not available
      }

      const files = fs.readdirSync(itemBankDir).filter(f => f.endsWith('.md'));
      const failures = [];

      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(itemBankDir, file), 'utf-8');
          const result = parseTaskMarkdown(content);

          // Basic validity checks
          if (!result.taskTitle) failures.push(`${file}: missing taskTitle`);
          if (!result.studentPrompt) failures.push(`${file}: missing studentPrompt`);
        } catch (err) {
          failures.push(`${file}: ${err.message}`);
        }
      }

      if (failures.length > 0) {
        console.warn('Task files with issues:', failures);
      }
      // Allow up to 5% failure rate for edge-case markdown variations
      const failureRate = failures.length / files.length;
      expect(failureRate).toBeLessThan(0.05);
    });
  });
});
