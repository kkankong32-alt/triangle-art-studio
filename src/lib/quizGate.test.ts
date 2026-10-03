import { describe,it,expect,afterEach } from 'vitest';
import { QUIZ_PASS_KEY,QUIZ_URL,decideAfterCover,hasPassedQuiz,isQuizGateEnabled,__setQuizGateTestOverride } from './quizGate';
import { isHostedDeployment } from './hosting';
describe('entry quiz gate',()=>{
  afterEach(()=>__setQuizGateTestOverride(null));
  it('uses the key the quiz site writes and points at the deployed quiz',()=>{
    expect(QUIZ_PASS_KEY).toBe('triangle_art_quiz_passed');
    expect(QUIZ_URL).toBe('https://kkankong32-alt.github.io/triangle-art-studio-quiz/');
  });
  it('sends students who have not passed to the quiz, and passers (or an inactive gate) to the editor',()=>{
    expect(decideAfterCover(true,false)).toBe('quiz');
    expect(decideAfterCover(true,true)).toBe('editor');
    expect(decideAfterCover(false,false)).toBe('editor');
    expect(decideAfterCover(false,true)).toBe('editor');
  });
  it('is only active on a real deployment — not dev, localhost, 127.0.0.1 or file:// (standalone)',()=>{
    expect(isQuizGateEnabled({prod:true,protocol:'https:',hostname:'kkankong32-alt.github.io'})).toBe(true);
    expect(isQuizGateEnabled({prod:false,protocol:'https:',hostname:'kkankong32-alt.github.io'})).toBe(false);
    expect(isQuizGateEnabled({prod:true,protocol:'http:',hostname:'localhost'})).toBe(false);
    expect(isQuizGateEnabled({prod:true,protocol:'http:',hostname:'127.0.0.1'})).toBe(false);
    expect(isQuizGateEnabled({prod:true,protocol:'file:',hostname:''})).toBe(false);
  });
  it('shares one hosting rule with analytics',()=>{
    expect(isHostedDeployment({prod:true,protocol:'https:',hostname:'example.com'})).toBe(true);
    expect(isHostedDeployment({prod:true,protocol:'file:',hostname:''})).toBe(false);
  });
  it('treats a missing sessionStorage (no window) as "not passed" without throwing',()=>{
    expect(hasPassedQuiz()).toBe(false);
  });
});
