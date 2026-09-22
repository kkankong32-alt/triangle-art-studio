import { describe,it,expect,afterEach } from 'vitest';
import { GA_DESTINATIONS,isAnalyticsEnabled,trackEvent,__setAnalyticsTestOverride } from './analytics';

describe('GA4 destinations',()=>{
  it('lists both properties, in one place',()=>{
    expect(GA_DESTINATIONS).toEqual(['G-DC7N6KQBG0','G-5YW0T2C109']);
  });
});

describe('isAnalyticsEnabled',()=>{
  afterEach(()=>__setAnalyticsTestOverride(null));
  it('is disabled outside a production build',()=>{
    expect(isAnalyticsEnabled({prod:false,protocol:'https:',hostname:'example.com'})).toBe(false);
  });
  it('is disabled on localhost even in a production build',()=>{
    expect(isAnalyticsEnabled({prod:true,protocol:'http:',hostname:'localhost'})).toBe(false);
  });
  it('is disabled on 127.0.0.1',()=>{
    expect(isAnalyticsEnabled({prod:true,protocol:'http:',hostname:'127.0.0.1'})).toBe(false);
  });
  it('is disabled on the file:// protocol (the standalone HTML build)',()=>{
    expect(isAnalyticsEnabled({prod:true,protocol:'file:',hostname:''})).toBe(false);
  });
  it('is enabled for a production build served over https on a real hostname',()=>{
    expect(isAnalyticsEnabled({prod:true,protocol:'https:',hostname:'triangle-art.example.com'})).toBe(true);
  });
});

describe('trackEvent is always safe to call',()=>{
  afterEach(()=>__setAnalyticsTestOverride(null));
  it('does nothing (and does not throw) when analytics is disabled, even without window',()=>{
    __setAnalyticsTestOverride(false);
    expect(()=>trackEvent('triangle_created',{method:'button'})).not.toThrow();
  });
  it('does not throw even when "enabled" and there is no window/gtag in this environment',()=>{
    __setAnalyticsTestOverride(true);
    expect(()=>trackEvent('triangle_created',{method:'drag'})).not.toThrow();
  });
});
