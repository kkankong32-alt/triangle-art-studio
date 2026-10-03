import cover from '../assets/triangle-art-cover-main.webp';
// The cover image already contains the title, tagline, start-button graphic and credit line —
// this component never redraws that text in HTML. `.cover-frame` is sized in CSS to exactly
// match the image's own 1672x941 aspect ratio (letterboxed within the viewport), so the
// invisible `.cover-start` hotspot — positioned by percentage — always lines up with the
// button drawn in the image, at any viewport size.
export function Cover({state,onStart}:{state:'visible'|'closing';onStart:()=>void}) {
  return <div className={`cover${state==='closing'?' cover-closing':''}`}>
    <div className="cover-frame">
      <img src={cover} alt="삼각형, 예술을 그리다 2.0 — 각을 탐구하고 삼각형을 조합해 멋진 폴리곤 아트를 만들어요. 쓰로인훈쌤 김종훈 기획·제작, 초등 수업을 위한 무료 교육 콘텐츠" draggable={false}/>
      <button className="cover-start" aria-label="삼각형, 예술을 그리다 시작하기" onClick={onStart}/>
    </div>
  </div>;
}
