# **How Cognality Works**

### **1\. Cognality Discovery Test (5 minutes)**

The learner begins with a short, 30-item **Cognality Discovery Test**.  
 Each item presents a thinking or problem-solving statement that the student rates from **“Not like me at all”** to **“Totally like me.”**  
 This identifies the learner’s **Cognality**—their natural cognitive tendency:

| Cognality | Core Pattern | Strength Example |
| ----- | ----- | ----- |
| **Decoder** | Analytical, precise | Step-by-step logic |
| **Synthesizer** | Integrates concepts | Sees structure and connections |
| **Imaginator** | Visual and intuitive | Thinks in images and possibilities |
| **Seeker** | Curious and exploratory | Asks questions, plays with ideas |
| **Builder** | Hands-on problem solver | Learns by doing and testing |

**Output:**  
 A **Cognality Profile** describing *how the student naturally thinks and learns.*

---

### **2\. Avatar-Based Task Launch**

Each Cognality is represented by a **character avatar** that guides the learner into the task.

The avatar provides:

* A **starting narrative tone** aligned to the learner’s reasoning pattern

* **A default prompt** that scaffolds the performance task

* A familiar sense of identity and encouragement

Example:

* Decoders begin with: *“Show me your step-by-step approach. Teach me how you start.”*

* Synthesizers begin with: *“Help me see how the ideas fit together.”*

* Imaginators begin with: *“What picture or image comes to mind here?”*

* Seekers begin with: *“What are you wondering about first?”*

* Builders begin with: *“Let’s try this out and see what happens.”*

**This ensures every student begins in a cognitive “home space.”**

---

### **3\. Mind-Sparring Dialogue (Reasoning Made Visible)**

The learner teaches a **curious digital companion** how to solve the task.

The system intentionally:

* **Does not give answers**

* **Asks clarifying and probing questions**

* **Reflects the student’s thinking back to them**

This draws out:

* Reasoning steps

* Strategy choices

* Conceptual understanding

* Misconception patterns

**Thinking becomes visible in language.**

---

### **4\. Extraction of Reasoning Evidence**

As the learner explains, Cognality continuously captures and structures:

| Evidence Type | What It Shows |
| ----- | ----- |
| Strategy Pattern | How the learner approaches problems |
| Conceptual Understanding | What ideas the learner grasps or misinterprets |
| Metacognitive Markers | When the learner notices, checks, or adjusts thinking |
| Cognitive Flexibility | Ability to shift strategies when needed |

This evidence updates the learner’s **Cognitive Growth Record**.

---

### **5\. Personalized and Adaptive Cognitive Coaching**

Based on the reasoning evidence, Cognality introduces **targeted coaching prompts** tailored to the learner’s Cognality:

For example:

* Decoder → “Can you show where the idea connects to an earlier step?”

* Synthesizer → “Which idea is central here, and why?”

* Imaginator → “What picture changes when your thinking changes?”

* Seeker → “Which question should we follow next?”

* Builder → “Try a second approach. What changes when you switch methods?”

Coaching is:

* Timely

* Nonjudgmental

* Strategy-focused

* Personalized to cognitive identity

This develops:

* Metacognition

* Strategic reasoning

* Flexible problem-solving

* Confidence and ownership

# **Cognality Reasoning-Extraction Engine Roadmap**

## **Phase 1: MVP (0–6 months)**

**Goal:** Capture reasoning evidence in a structured but **human-interpretable** format, without requiring model automation.  
 This phase prioritizes *reliability, clarity, and proof of instructional value.*

**Key Actions**

* Use carefully designed **scripted mind-sparring prompts** to elicit reasoning.

* Capture student explanations in **structured conversational turns**.

* Apply **manually validated reasoning rubrics** adapted from CZI Evaluator and Evidence-Centered Design.

* Log indicators such as:

  * Strategy used

  * Conceptual understanding cues

  * Metacognitive reflection phrases

  * Misconception signals

**Technical Approach**

* Rule-based heuristics \+ light-weight pattern detectors (LLM scoring prompts).

* Prototype dashboard shows **reasoning patterns over time**, not fully automated scoring.

**Why This Works**  
 This demonstrates *visible thinking growth* without needing a fully automated reasoning model.

**Proof Milestones**

* 5–10 pilot learners show **clear reasoning profiles** that tutors validate as accurate.

* Tutoring centers use the report in **parent communication**, improving trust and retention.

---

## **Phase 2: Adaptive Reasoning Model (6–18 months)**

**Goal:** Move from **reasoning capture → reasoning interpretation → adaptive coaching.**

**Key Actions**

* Train **few-shot LLM evaluation prompts** that reliably classify:

  * Strategy patterns (e.g., build-first, simplify-first, visualize-first)

  * Approximate conceptual models (correct, partial, overgeneralized)

  * Metacognitive awareness levels (implicit, emerging, intentional)

* Introduce **avatar-based cognitive-style adaptive scaffolds** based on Cognality profiles.

* Shift from scripted prompting → **dynamic turn-by-turn adaptive dialogue**.

**Technical Approach**

* LLM-as-evaluator \+ structured scoring schemas.

* Store reasoning traces in a **knowledge graph** linked to conceptual nodes.

**Why This Matters**  
 This is where Cognality begins to **coach thinking**, not just observe it.

**Proof Milestones**

* Students demonstrate measurable growth in strategy selection and metacognitive language.

* Centers request expansion to more students — organic pull, not push.

---

## **Phase 3: Full Cognitive Intelligence Engine (18–36 months)**

**Goal:** Achieve **generalizable reasoning-pattern inference** and scalable personalization.

**Key Actions**

* Train persistent **Cognality Profile Models** that update from multi-task reasoning traces.

* Use **temporal reasoning models** to observe growth trajectories over weeks/months.

* Generate **personalized cognitive growth plans** across subjects and contexts.

* Provide an **API for EdTech and curriculum platforms** (Layer 3 business model).

**Technical Approach**

* Structured LLM scoring pipelines → distilled into **compact reasoning-state classifiers**.

* Integration with CZI Knowledge Graph or equivalent conceptual map.

* Active learning loops improve model performance as more students use the system.

**Why This is the Moat**  
 The value is not in one task — it is in **the stability of a reasoning identity over time.**  
 This is extremely difficult to replicate.

**Proof Milestones**

* Cognality’s reasoning profiles predict instructional response patterns better than existing assessment data.

* Multiple platforms license the Cognality API for personalization.

# **Data / Input Needed for the MVP**

## **1\. Cognality Discovery Test Responses**

Format: 30 Likert-scale self-descriptions  
 Purpose: Establish **cognitive style baseline**

Data captured:

* Item-level response values (1–5)

* Total \+ pattern of selections

* Initial Cognality classification

* Confidence/consistency score (optional)

This supports:

* Avatar selection

* Default prompt tone

* Initial coaching stance

---

## **2\. Performance Task Prompt \+ Expected Evidence**

Format: Structured task (e.g., ratio scenario, geometry reasoning scenario, argumentation scenario)  
 Purpose: Define **what reasoning looks like in this task**

Data needed:

* Task context text

* Problem statement

* Anticipated reasoning strategies

* Common misconception patterns

* Rubric aligned to Evidence-Centered Design

This ensures the system knows **what to listen for**.

---

## **3\. Student Reasoning Dialogue (Text or Speech-to-Text)**

Format: Turn-by-turn conversation in the mind-sparring session  
 Purpose: Make student **thinking visible**

Data captured:

* Student explanation text

* Student revisions/corrections

* Sequence of reasoning statements

* Questions student asks the AI

* Length / structure / coherence of explanation

This is the **core reasoning evidence signal**.

---

## **4\. AI Prompt \+ Follow-up Prompts**

Format: Pre-authored and lightly adaptive curiosity-driven conversational questions  
 Purpose: Elicit **reason explanation**, not answers

Data needed:

* Opening prompt based on Cognality (e.g., “Show me how you see this…”)

* Clarification prompts (e.g., “What makes that step make sense?”)

* Reflection prompts (e.g., “What changed in your thinking?”)

No heavy NLP needed — **just structured prompting**.

---

## **5\. Reasoning Evidence Labels (Light Manual Review at First)**

Purpose: Build reliability before automation

Data captured:

* Did the student articulate a strategy? (Y/N)

* Did they justify a step? (Emerging / Clear)

* Did they revise thinking? (Not present / Present)

* Was misunderstanding detected? (Yes / No / Needs more evidence)

**This is the rubric that powers the MVP.**  
 Not correctness — **evidence of thinking moves.**

---

## **6\. Minimal Session Metadata**

Purpose: Support learning pattern interpretation, not performance scoring

Data captured:

* Time spent explaining

* Number of turns in reasoning

* Where confusion occurred

* Whether student switched strategies

Used to show **process growth**, not academic outcomes.

These prompts are designed for the **MVP** — meaning they are **simple, reusable, and do not require adaptive modeling yet**.

They are grouped into three stages of the performance task:

1. **Start Prompt** (how the student begins thinking / explaining)

2. **Clarification Prompts** (to draw out reasoning evidence)

3. **Reflection / Growth Prompts** (to develop metacognition)

No leading. No answer hints. Just **thinking visibility.**

---

# **Cognality Prompt Library (MVP Version)**

## **1\. DECODER**

**Pattern:** Precise, step-by-step, prefers clear structure  
 **Tone:** Respect their logic and sequencing

**Start Prompt**

Can you show me how you would begin this problem step by step? I want to follow your process.

**Clarification Prompts**

What made you choose that step first?  
 How did you decide what to do next?  
 Can you explain the relationship between these two steps?

**Reflection Prompts**

Which step mattered most in making the problem clearer?  
 If you had to teach someone else this process, how would you simplify it?

---

## **2\. SYNTHESIZER**

**Pattern:** Sees patterns, big-picture structure  
 **Tone:** Encourage meaning-making and connection

**Start Prompt**

What is the main idea or structure you notice here? Help me see how the parts fit together.

**Clarification Prompts**

Which connections guided your thinking?  
 How do the pieces of this problem relate to each other?  
 Can you show the pattern you noticed?

**Reflection Prompts**

How did the pattern help you choose a strategy?  
 Is there a broader idea you could use again in a different situation?

---

## **3\. IMAGINATOR**

**Pattern:** Visual, spatial, intuitive reasoning  
 **Tone:** Invite images, metaphors, internal models

**Start Prompt**

What picture or image comes to mind when you see this problem? Describe it to me.

**Clarification Prompts**

How does your picture change as you think more about it?  
 Can you sketch, gesture, or describe the space of the problem?  
 What does the solution look like to you?

**Reflection Prompts**

What part of the picture helped the idea make more sense?  
 If the picture shifted, how did your understanding shift with it?

---

## **4\. SEEKER**

**Pattern:** Curious, exploratory, questions-first  
 **Tone:** Honor inquiry and discovery

**Start Prompt**

What are you wondering about as you look at this problem? Let’s start there.

**Clarification Prompts**

Which idea feels most interesting or uncertain right now?  
 What did you find when you tried that approach?  
 What question do you want to ask next?

**Reflection Prompts**

How did your question guide your thinking toward the solution?  
 What new insight did your exploration reveal?

---

## **5\. BUILDER**

**Pattern:** Hands-on reasoning, trial-and-adjust  
 **Tone:** Support iterative experimentation

**Start Prompt**

Let’s try something and see what happens. What will you test first?

**Clarification Prompts**

What did you notice after testing that step?  
 What did you change when it did not work the first time?  
 Can you compare two attempts and explain what shifted?

**Reflection Prompts**

Which attempt felt the most effective and why?  
 What did you learn about the idea by testing it rather than planning it?

