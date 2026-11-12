import fs from 'fs';
import path from 'path';

const partnerMdPath = path.join(__dirname, '..', 'prompts', 'partner.md');
const partnerTemplate = fs.readFileSync(partnerMdPath, 'utf-8');

const SCENARIO_LABELS: Record<string, string> = {
  restaurant:       'restaurant — at a restaurant ordering food and speaking to staff (レストランで)',
  cafe:             'pastel cafe — casual conversation while enjoying sweets and drinks at a cute cafe (カフェで)',
  station:          'train station — asking for directions, buying tickets, and navigating (駅で)',
  shopping:         'anime/manga shop — browsing, asking about prices and products (アニメショップで)',
  self_intro_work:  'self introduction at work — introducing yourself to new Japanese colleagues (職場での自己紹介)',
  asking_directions:'asking directions — asking for and understanding directions on the street (道を尋ねる)',
  job_interview:    'job interview — a formal job interview setting (就職面接)',
};

const REGISTER_LABELS: Record<string, string> = {
  casual: 'casual (タメ口・友達言葉) — use plain form, contractions, casual expressions',
  polite: 'polite (丁寧語) — use です/ます form throughout',
  business: 'business formal (敬語・ビジネス語) — use keigo and formal expressions',
};

const CORRECTION_MODE_NOTES: Record<string, string> = {
  immediate:
    'immediate — always fill the correction field when there is an error; the UI will show it right away',
  end_of_session:
    'end_of_session — still fill the correction field for every error (the UI hides corrections until the session ends, but you must always populate the field accurately)',
};

export interface PromptOptions {
  level: string;
  scenario: string;
  register: string;
  correctionMode: string;
}

export function buildSystemPrompt(options: PromptOptions): string {
  const { level, scenario, register, correctionMode } = options;

  const settingsBlock = [
    '## Current Session Settings',
    '',
    `- **JLPT Level**: ${level}`,
    `- **Scenario**: ${SCENARIO_LABELS[scenario] ?? scenario}`,
    `- **Register**: ${REGISTER_LABELS[register] ?? register}`,
    `- **Correction Mode**: ${CORRECTION_MODE_NOTES[correctionMode] ?? correctionMode}`,
  ].join('\n');

  return `${partnerTemplate}\n\n${settingsBlock}`;
}
