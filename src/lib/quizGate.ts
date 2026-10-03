import { isHostedDeployment, type HostingEnv } from './hosting';
// The entry quiz is its own site (kkankong32-alt/triangle-art-studio-quiz). It records
// sessionStorage[QUIZ_PASS_KEY]='1' on pass; both sites share the github.io origin, so the app
// can read that same key. The cover's "시작하기" goes to the quiz until it has been passed.
export const QUIZ_PASS_KEY = 'triangle_art_quiz_passed';
export const QUIZ_URL = 'https://kkankong32-alt.github.io/triangle-art-studio-quiz/';

// Test-only escape hatch (production never calls it), same idea as analytics' override.
let testOverride: boolean | null = null;
export function __setQuizGateTestOverride(value: boolean | null): void { testOverride = value; }

// The gate only applies on a real deployment. In dev, localhost, and the offline standalone
// HTML the quiz site is unreachable/irrelevant, so those go straight to the editor.
export function isQuizGateEnabled(env?: HostingEnv): boolean {
  if (testOverride !== null) return testOverride;
  return isHostedDeployment(env);
}

export function hasPassedQuiz(): boolean {
  try { return window.sessionStorage.getItem(QUIZ_PASS_KEY) === '1'; } catch { return false; }
}

export type AfterCover = 'editor' | 'quiz';
export function decideAfterCover(gateEnabled: boolean, passed: boolean): AfterCover {
  return gateEnabled && !passed ? 'quiz' : 'editor';
}
