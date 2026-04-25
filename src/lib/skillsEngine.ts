// Mock Skills Signal Engine — keyword-driven extraction that returns
// ESCO/ISCO-08 tagged skills in the same shape a real backend would.

import type { Skill } from "@/types/api";

interface Rule {
  match: RegExp;
  skill: Omit<Skill, "id" | "sourceQuote">;
}

const RULES: Rule[] = [
  {
    match: /\b(phone|mobile|screen|battery|repair|fix|electronics|motherboard|flash)\b/i,
    skill: {
      label: "Mobile Device Repair",
      formalName: "Electronics Mechanic",
      iscoCode: "7421",
      escoUri: "esco/occupation/7421-electronics-mechanic",
      classification: "durable",
      confidence: 0.86,
    },
  },
  {
    match: /\b(business|shop|sell|market|customer|client|run|manage|stock)\b/i,
    skill: {
      label: "Business Ops",
      formalName: "Small Enterprise Operations",
      iscoCode: "1420",
      escoUri: "esco/occupation/1420-retail-services-managers",
      classification: "durable",
      confidence: 0.74,
    },
  },
  {
    match: /\b(sim|airtime|recharge|top.?up|cashier|till|change)\b/i,
    skill: {
      label: "Cash Handling",
      formalName: "Cashier / Point-of-Sale Operator",
      iscoCode: "5230",
      escoUri: "esco/occupation/5230-cashiers",
      classification: "at_risk",
      confidence: 0.69,
    },
  },
  {
    match: /\b(install|wiring|solar|panel|electric|cable|generator)\b/i,
    skill: {
      label: "Electrical Install",
      formalName: "Electrical Equipment Installer",
      iscoCode: "7411",
      escoUri: "esco/occupation/7411-building-electricians",
      classification: "durable",
      confidence: 0.81,
    },
  },
  {
    match: /\b(teach|train|tutor|help.*learn|show.*how)\b/i,
    skill: {
      label: "Peer Coaching",
      formalName: "Vocational Instructor (informal)",
      iscoCode: "2320",
      escoUri: "esco/occupation/2320-vocational-teachers",
      classification: "durable",
      confidence: 0.66,
    },
  },
  {
    match: /\b(type|data entry|forms|paperwork|spreadsheet)\b/i,
    skill: {
      label: "Data Entry",
      formalName: "Data Entry Clerk",
      iscoCode: "4132",
      escoUri: "esco/occupation/4132-data-entry-clerks",
      classification: "at_risk",
      confidence: 0.71,
    },
  },
];

function findSentence(narrative: string, regex: RegExp): string {
  const sentences = narrative.split(/(?<=[.!?])\s+/);
  return sentences.find((s) => regex.test(s)) ?? narrative.slice(0, 120);
}

export function extractSkills(narrative: string): Skill[] {
  if (!narrative.trim()) return [];
  const out: Skill[] = [];
  RULES.forEach((rule, idx) => {
    if (rule.match.test(narrative)) {
      out.push({
        ...rule.skill,
        id: `sk_${idx}_${Date.now().toString(36)}`,
        sourceQuote: findSentence(narrative, rule.match).trim(),
      });
    }
  });
  // Always return at least one skill so the UI never empties
  if (out.length === 0) {
    out.push({
      id: `sk_default_${Date.now().toString(36)}`,
      label: "Adaptable Worker",
      formalName: "Elementary Occupations (general)",
      iscoCode: "9000",
      escoUri: "esco/occupation/9000-elementary-occupations",
      classification: "durable",
      confidence: 0.5,
      sourceQuote: narrative.slice(0, 120),
    });
  }
  return out;
}
