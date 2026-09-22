import { approximatelyEqual, calculateThirdAngle, validateAngles } from './geometry';
export type AngleType='acute'|'right'|'obtuse';
export const angleLabels:Record<AngleType,string>={acute:'예각삼각형',right:'직각삼각형',obtuse:'둔각삼각형'};
export const textbookColors:Record<AngleType,string>={acute:'#E46F6A',right:'#EEC64E',obtuse:'#538FD1'};
export function classifyByAngles(a:number,b:number):AngleType { const angles=[a,b,calculateThirdAngle(a,b)];return angles.some(v=>approximatelyEqual(v,90))?'right':Math.max(...angles)>90?'obtuse':'acute'; }
export function classifyBySides(a:number,b:number) { const c=calculateThirdAngle(a,b);const isEquilateral=approximatelyEqual(a,b)&&approximatelyEqual(b,c);const isIsosceles=approximatelyEqual(a,b)||approximatelyEqual(b,c)||approximatelyEqual(a,c);return {isEquilateral,isIsosceles,isScalene:!isIsosceles}; }
export function getTriangleProperties(a:number,b:number) {if(!validateAngles(a,b))throw new Error('올바르지 않은 각도');return {angleType:classifyByAngles(a,b),...classifyBySides(a,b)};}
