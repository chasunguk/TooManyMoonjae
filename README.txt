TMM - 문제가 많은 게 문제 | 화면 오류 수정판

GitHub Pages 저장소: https://github.com/chasunguk/TooManyMoonjae

업로드는 index.html 과 answer.html 두 파일만 하면 됩니다.
이전 styles.css, generator.js, main.js, answers.js, qr.js는 더 이상 필요하지 않습니다.
남아 있어도 오류는 나지 않지만, 삭제해도 됩니다.

교체 방법
1. GitHub 저장소 Code 화면에서 index.html을 열고 연필(Edit) 아이콘을 누릅니다.
2. 새로운 index.html의 전체 내용을 붙여넣고 Commit changes 합니다.
3. 같은 방법으로 answer.html도 교체합니다.
4. GitHub Pages 배포가 끝나면 Ctrl+Shift+R로 강력 새로고침합니다.

또는 GitHub 저장소에서 Add file -> Upload files를 사용하여 두 파일을 덮어쓸 수 있습니다.
기존 파일이 이미 있을 때 Github 웹 인터페이스가 업로드 충돌을 표시하면 각각 파일 편집을 이용하십시오.

수정사항
- 스타일과 동작 스크립트를 각 HTML 안에 내장하여 파일 버전 혼선 방지
- 난이도 툴팁을 기본 비표시, 마우스 호버 / 키보드 포커스 시에만 표시
- 계산기와 설정 영역의 불필요한 늘어남 방지
- 원래 기능(유형별 수량, 난이도, A4 미리보기, QR 정답지) 유지

참고: QR은 GitHub Pages에서 배포한 페이지 주소를 가리킵니다.
로컬 파일로 열면 QR이 로컬 file:// 주소로 생성될 수 있으므로 온라인 배포 뒤 시험하십시오.
