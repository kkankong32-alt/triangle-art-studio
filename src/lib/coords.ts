import type { Point } from './geometry';
// Pure screen -> artboard logical coordinate conversion, independent of DOM/Konva so it is easy to unit test.
// `rect` is the on-screen box that exactly represents the logical (logicalWidth x logicalHeight) artboard,
// e.g. the bounding rect of the white artboard element. Returns null when the point falls outside it,
// which callers use to cancel a drag-to-create instead of clamping it onto the canvas.
export interface ScreenRect { left:number; top:number; width:number; height:number }
export function screenToArtboard(rect:ScreenRect,clientX:number,clientY:number,logicalWidth=1200,logicalHeight=800):Point|null {
  if(!(rect.width>0)||!(rect.height>0)) return null;
  if(clientX<rect.left||clientX>rect.left+rect.width||clientY<rect.top||clientY>rect.top+rect.height) return null;
  return {x:(clientX-rect.left)/rect.width*logicalWidth,y:(clientY-rect.top)/rect.height*logicalHeight};
}
