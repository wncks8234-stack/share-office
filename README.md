# Yoolmi 실시간 공유 오피스

GitHub Pages로 배포돼요: https://wncks8234-stack.github.io/share-office/

- index.html: 오피스 화면 (Claude Design 캔버스에서 내보낸 페이지)
- _blob/: 오피스 배경 그림 (45°·위·앞·1인칭 바닥, 낮·밤)
- .nojekyll: _blob 폴더가 숨겨지지 않게

## 업데이트 방법
- 캔버스(Claude Design)의 `project/Main.dc.html`을 받아 `python3 tools/rebuild.py Main.dc.html` → index.html이 다시 만들어져요.
- 배경 그림을 새로 만들면 `_blob/<id>.svg`로 넣어요 (id는 Main.dc.html의 `this.BG` 값).
- `tools/shell.html`은 캔버스에서 내보낸 페이지 틀이에요 (런타임·폰트·캐릭터 부품). 캐릭터 부품(Avatar)을 바꾸면 HTML을 다시 내보내서 이 파일을 바꿔야 해요.
