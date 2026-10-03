# 삼각형, 예술을 그리다 2.0

초등학교 4학년을 위한 Triangle Art Studio. 각을 조절해 정확한 삼각형을 만들고, 조합하여 폴리곤 아트를 제작하는 정적 웹앱입니다. 서버·계정·개인정보 수집·외부 폰트 요청이 없습니다.

## 실행

Node.js 22 이상을 권장합니다. 프로젝트 루트에서:

```sh
npm install
npm run dev
```

표시된 localhost 주소를 브라우저에서 엽니다. `index.html` 파일을 직접 더블클릭하는 방식은 지원하지 않습니다 (서버 없이 열어야 한다면 아래 "설치 없이 완성본 실행"의 단일 파일 빌드를 사용하세요).

```sh
npm run test -- --run
npm run lint
npm run build
npm run preview
npm run build:standalone
```

`lint`는 TypeScript 엄격 검사입니다. 별도 ESLint 규칙 검사는 아닙니다. `build:standalone`은 아래 "단일 파일로 내보내기"를 참고하세요.

## 기능

- 첫 진입 시 전체 화면 표지(인트로) — 이미지 속 "시작하기" 그래픽 위치에 투명 hotspot 버튼을 퍼센트 좌표로 겹쳐 반응형으로 정렬하며, 마우스·키보드(Enter/Space)·터치 모두로 진입할 수 있습니다. 편집기 하단에는 작은 제작자 크레딧이 표시되며 저장되는 PNG에는 들어가지 않습니다. 새로고침하면 표지가 다시 나타나고, More 메뉴의 "표지로 돌아가기"로 작품을 지우지 않고 언제든 다시 볼 수 있습니다
- A/B 각도 조절, C 자동 계산, 정확한 실시간 미리보기, 다중 성질 분류
- 미리보기 삼각형을 마우스·터치로 직접 눌러 아트보드의 원하는 위치에 놓기(끌어다 놓기), 기존 "삼각형 추가" 버튼도 동일하게 유지 — 두 방식 모두 같은 생성 로직을 사용하며 현재 각도·색상·분류가 그대로 적용됩니다
- 자유 색상 팔레트 / 교과서 활동 자동 색상
- 선택, Shift 다중 선택, 영역 선택, 터치 다중 선택 도구
- 이동, 회전, 균등 크기 조절, 복제, 삭제, 그룹/해제, 앞으로/뒤로
- 80단계 실행 취소/다시 실행, 내부 복사/붙여넣기
- 화면 기준 12px 꼭짓점 스냅과 가이드
- 각·변·색 통계 및 비파괴 분석 강조
- 작품 PNG / 작품 카드 PNG, 투명 배경, 2배 해상도
- 검증된 JSON 저장/불러오기, 로컬 자동 백업과 복원 안내

분류는 각으로부터 매번 계산합니다. 모드 변경은 새로 만드는 삼각형에 적용되며 기존 작품 색은 유지됩니다. 배열 순서가 쌓임 순서이고 groupId가 그룹을 표현합니다. 그룹 선택 시 모든 구성원을 선택하며 변환 결과는 각 삼각형의 위치·회전·단일 scale에 저장합니다.

## Google Analytics

이 프로젝트는 실제 웹 배포 환경에서만 익명화된 주요 기능 사용 통계를 수집합니다.

GA4:

- `G-DC7N6KQBG0`
- `G-5YW0T2C109`

localhost 및 standalone HTML(`file://`)에서는 Analytics가 비활성화됩니다. 개인정보와 작품 내용(이름·이미지·JSON·전체 좌표)은 Analytics로 전송하지 않으며, `삼각형 생성`·`작품 분석 열람`·`내보내기`처럼 의미 있는 조작에 한해 각도 종류·모드 같은 최소 정보만 기록합니다. 구현은 [lib/analytics.ts](src/lib/analytics.ts)를 참고하세요.

## 수학 원칙

사인 법칙으로 AB=c, AC=c·sin(B)/sin(C), C점=(AC·cos(A), −AC·sin(A))를 계산합니다. 경계 상자에 맞출 때 두 축에 동일한 배율을 적용합니다. 모든 각은 5° 이상이며 A+B≤175를 슬라이더 범위로 보장합니다. 0.01° 오차 허용을 사용합니다. 같은 각의 맞은편 변은 같다는 정리에 따라 이등변/정삼각형을 판정하며 정삼각형은 이등변삼각형에도 포함됩니다.

UI용 Konva와 독립된 순수 함수이며, 내보내기는 별도 Canvas 2D 표면에 원본 데이터를 그립니다. 선택·스냅·분석 필터는 PNG에 포함될 수 없습니다. 미리보기 → 아트보드 드래그 생성의 화면 좌표 변환(`lib/coords.ts`)도 같은 원칙으로 DOM/Konva와 분리된 순수 함수이며, 아트보드 밖에 놓으면 생성을 취소합니다.

## 구조

```text
src/
  App.tsx                   앱 연결 및 파일·키보드 동작
  components/Cover.tsx      전체 화면 표지(인트로) — 퍼센트 좌표 hotspot
  components/               제작 패널·분석·선택 도구·대화상자
  assets/triangle-art-cover-main.webp 표지 원본 이미지(1672×941)
  canvas/Artboard.tsx        Konva 편집 및 Transformer
  lib/geometry.ts           순수 좌표 계산
  lib/coords.ts              화면 → 아트보드 좌표 변환(드래그 생성용)
  lib/analytics.ts           GA4 래퍼(배포 환경에서만 활성화, gtag 안전 호출)
  lib/classification.ts     각과 변의 다중 분류
  lib/statistics.ts          통계 및 뷰 필터
  lib/snapping.ts            꼭짓점 스냅
  lib/model.ts               프로젝트·삼각형 타입
  lib/projectFile.ts         JSON 검증 및 저장
  lib/exportArtwork.ts       독립 PNG 렌더링
  lib/*.test.ts              수학·편집 단위 테스트
  store/editor.ts           편집 이력 및 복제
  styles.css                반응형 디자인
scripts/serve.mjs           dist를 로컬 정적 서버로 제공
scripts/build-standalone.mjs 단일 파일 HTML 빌드(아래 참고)
tests/                      브라우저 통합 검증 스크립트
```

## GitHub Pages

Vite `base: './'`를 사용하여 저장소 하위 경로에서도 자산을 불러옵니다. GitHub에 프로젝트를 올린 뒤 Settings → Pages → Source에서 GitHub Actions를 선택합니다. 포함된 `.github/workflows/pages.yml`이 main 브랜치에서 테스트·빌드 후 dist를 배포합니다. 자동 배포는 이 작업에서 실제로 실행하지 않았습니다.

참고: [Vite 정적 배포](https://vite.dev/guide/static-deploy), [상대 base](https://vite.dev/guide/build), [Konva Transformer](https://konvajs.org/docs/react/Transformer.html).

## 검증 및 제한

44개 단위 테스트(`npm run test -- --run`): 명세의 분류 9종, 극단 각도 회귀 13종, 모든 유효한 정수 각 조합, 좌표에서 역산한 실제 각, 회전·균등 확대 불변성, 이력·복제·통계·파일 검증·스냅, 드래그 생성 좌표 변환(반응형으로 아트보드 크기가 달라져도 동일한 논리 좌표, 경계 밖은 null)과 드래그 생성물의 각도·색상·undo/redo, GA4 활성화 조건(개발/localhost/127.0.0.1/file:// 비활성화, 배포 환경 활성화)과 gtag 미존재 시 안전성을 검사합니다.

`tests/browser-*.mjs`는 Windows의 Edge/Chrome 설치 경로와 localhost:5173 개발 서버를 사용하는 Playwright 스크립트입니다(실행 전 `work`, `outputs` 폴더를 만들고 `npm run dev`를 띄운 뒤 `node tests/<파일명>` 형태로 실행). 포함된 검사:

- `browser-smoke.mjs` — 데스크톱/태블릿 화면, 생성·복제·그룹/해제, PNG·JSON 다운로드, 삭제/취소, 불러오기·자동 복원
- `browser-interactions.mjs` — 실제 포인터 이동/모서리 균등 확대/회전, 그룹 확대, 투명 PNG와 작품 카드 렌더링
- `browser-stress.mjs` — 터치 입력, 태블릿 화면에서 "삼각형 추가" 버튼이 스크롤 없이 보이는지, 200개 삼각형에서의 렌더 성능
- `browser-drag-create.mjs` — 미리보기 드래그 생성이 정확한 드롭 위치·현재 각도/색상으로 생성되는지, 아트보드 밖 드롭은 취소되는지, 버튼 생성과 공존하는지, 화면 크기가 바뀌어도 좌표 변환이 맞는지, undo/redo, 분석 총계 반영
- `browser-drag-textbook.mjs` — 교과서 활동 모드에서 드래그 생성물이 자동 분류 색을 사용하는지
- `browser-cover.mjs` — 표지가 첫 로드에 보이고 편집기는 inert 상태인지, hotspot이 1440×900/1920×1080/태블릿에서 이미지 버튼과 퍼센트 단위로 정렬되는지, 마우스·키보드(Enter)·터치 모두로 진입되는지, "표지로 돌아가기"가 작품을 지우지 않는지, `intro_started`가 정확히 한 번 발생하는지
- `browser-credit.mjs` — 시작하기가 항상 편집기로 바로 진입하는지, 편집기 하단 크레딧(12px, 아트보드 아래)이 보이는지, 저장 PNG에 크레딧이 들어가지 않는지
- `browser-analytics.mjs` — localhost에서는 gtag 요청이 전혀 발생하지 않는지, 테스트 전용 override로 "배포 환경" 경로를 강제했을 때 gtag.js가 정확히 한 번 로드되고 두 GA4 속성이 설정되는지, `triangle_created`(버튼/드래그 구분, 슬라이더만으로는 미발생)·`mode_changed`(중복 클릭 시 미발생)·`analysis_opened`·`analysis_filter_used`·`artwork_exported`·`project_saved`·`project_loaded`·`help_opened`가 올바른 파라미터로 정확히 한 번씩 발생하는지, 어떤 이벤트에도 작품/좌표 데이터가 없는지를 실제 네트워크 요청 없이(`googletagmanager.com` 요청을 가로채 차단) 검사
- `browser-standalone.mjs` — 단일 파일 빌드(`삼각형_예술을_그리다.html`)를 `file://`로 직접 열어 표지 이미지가 data: URI로 인라인되어 보이는지, 시작하기 hotspot이 동작하는지, 각도 조절/생성/드래그 생성/이동/복제/삭제/분석/PNG 저장/프로젝트 저장·불러오기가 네트워크 요청 없이 동작하는지, gtag 스크립트가 전혀 로드되지 않는지

스마트폰 세로 화면에는 넓은 화면 안내를 제공합니다. 고급 변 스냅, 확대/이동 뷰포트, 임의 색상 팔레트 편집은 범위에서 제외했습니다. 실제 태블릿 하드웨어의 펜·멀티터치는 별도 현장 점검이 필요합니다. 브라우저 저장소를 지우면 자동 백업도 지워지므로 장기 보관에는 프로젝트 JSON을 사용하세요.

## 설치 없이 완성본 실행

두 가지 방법이 있습니다.

**1. dist + 로컬 서버(네트워크 아이콘 필요 없음, 그러나 서버 실행 필요)**: 배포용 dist가 포함되어 있습니다. Node.js가 설치되어 있다면 `npm run serve`로 실행하고 http://localhost:4173 을 여세요. Google Drive 같은 가상 드라이브에서 npm install에 쓰기 오류가 나는 경우에도 사용할 수 있습니다. 소스를 수정한 뒤에는 `npm run build`로 dist를 갱신해야 합니다.

**2. 단일 파일 HTML(서버 없이 더블클릭 실행)**: `npm run build:standalone`을 실행하면 JS·CSS가 모두 한 파일에 인라인된 `삼각형_예술을_그리다.html`이 프로젝트 루트에 생성됩니다. 이 파일은 Windows 탐색기에서 더블클릭만으로 Chrome 등 브라우저에서 바로 열리며, 인터넷 연결이나 서버 없이 각도 조절·생성·드래그 생성·이동·회전·크기 조절·작품 분석·PNG 저장·프로젝트 저장/불러오기가 모두 동작합니다(로컬 스토리지가 제한된 환경에서는 자동 백업만 비활성화되고 나머지 기능은 정상 동작합니다). 소스를 수정하면 다시 `npm run build:standalone`을 실행해 갱신하세요. 내부적으로 `vite.standalone.config.ts`로 코드 분할 없이 하나의 JS/CSS 파일을 만든 뒤 `scripts/build-standalone.mjs`가 이를 `index.html`에 인라인합니다(추가 빌드 의존성 없음).
