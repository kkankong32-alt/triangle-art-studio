import { describe,it,expect } from 'vitest';
import { screenToArtboard } from './coords';
describe('screen to artboard coordinate conversion',()=>{
  it('maps a point proportionally into the 1200x800 logical space',()=>{
    const rect={left:100,top:50,width:600,height:400};
    expect(screenToArtboard(rect,100,50)).toEqual({x:0,y:0});
    expect(screenToArtboard(rect,700,450)).toEqual({x:1200,y:800});
    expect(screenToArtboard(rect,400,250)).toEqual({x:600,y:400});
  });
  it('gives the same logical point regardless of how large the on-screen artboard is (responsive scaling)',()=>{
    const small={left:0,top:0,width:600,height:400},large={left:40,top:20,width:1800,height:1200};
    const relative=(rect:typeof small,fx:number,fy:number)=>screenToArtboard(rect,rect.left+rect.width*fx,rect.top+rect.height*fy);
    expect(relative(small,0.3,0.7)).toEqual(relative(large,0.3,0.7));
  });
  it('returns null outside any edge of the rect, and on the boundary it is inclusive',()=>{
    const rect={left:0,top:0,width:200,height:100};
    expect(screenToArtboard(rect,-1,50)).toBeNull();
    expect(screenToArtboard(rect,201,50)).toBeNull();
    expect(screenToArtboard(rect,100,-1)).toBeNull();
    expect(screenToArtboard(rect,100,101)).toBeNull();
    expect(screenToArtboard(rect,0,0)).toEqual({x:0,y:0});
    expect(screenToArtboard(rect,200,100)).toEqual({x:1200,y:800});
  });
  it('is null for a degenerate (zero-size) rect instead of dividing by zero',()=>{
    expect(screenToArtboard({left:0,top:0,width:0,height:0},0,0)).toBeNull();
  });
});
