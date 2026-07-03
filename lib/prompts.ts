import { GuidedPrompt } from "./types";

// Structured starter questions (Section 8, Journey A). These help a creator
// know what to record instead of facing a blank page.
export const PROMPTS: GuidedPrompt[] = [
  { id: "p1", category: "Milestones", question: "What do you want them to know on their wedding day?" },
  { id: "p2", category: "Milestones", question: "What advice would you give them on their graduation?" },
  { id: "p3", category: "Milestones", question: "What do you hope for them when they become a parent?" },
  { id: "p4", category: "Values", question: "What does hard work mean to you, and why?" },
  { id: "p5", category: "Values", question: "What principle has guided your biggest decisions?" },
  { id: "p6", category: "Family history", question: "Tell the story of how our family came to be." },
  { id: "p7", category: "Family history", question: "Who in our family should they know about, and why?" },
  { id: "p8", category: "Life lessons", question: "What mistake taught you the most?" },
  { id: "p9", category: "Life lessons", question: "What would you tell your younger self?" },
  { id: "p10", category: "Everyday love", question: "Record an ordinary 'good morning' the way you'd really say it." },
  { id: "p11", category: "Guidance", question: "What should they do with their first real income?" },
  { id: "p12", category: "Guidance", question: "How do you want them to handle hard times?" },
];

export const MILESTONES = [
  "Next birthday",
  "18th birthday",
  "21st birthday",
  "Graduation",
  "Wedding day",
  "Birth of their first child",
  "First job",
  "When they need me most",
];
