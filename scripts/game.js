const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const FPS = 60;

// ===== 크기 =====
const PLAYER_W = 40;
const PLAYER_H = 50;
const GAMTI_W = 15;
const GAMTI_H = 70;

// ===== 플레이어 =====
let player_x;
const player_y = canvas.height - PLAYER_H - 30;
let key_left = 0;
let key_right = 0;

// ===== 게임 상태 =====
let t = 0;
let score = 0;
let gameOver = false;
let bestScore = localStorage.getItem("bestScore") || 0;

// ===== 배경음 =====
const bgm = new Audio("sounds/bgm.mp3");
bgm.loop = true;
bgm.volume = 0.4;
let bgmOn = true;
let bgmStarted = false;

// ===== 첫 입력 시 BGM =====
function startBGMIfNeeded() {
  if (!bgmStarted && bgmOn) {
    bgm.play();
    bgmStarted = true;
  }
}

// ===== BGM 버튼 =====
const bgmBtn = document.getElementById("bgmBtn");
bgmBtn.addEventListener("click", () => {
  startBGMIfNeeded();
  bgmOn = !bgmOn;

  if (bgmOn) {
    bgm.play();
    bgmBtn.textContent = "🔊 BGM ON";
  } else {
    bgm.pause();
    bgmBtn.textContent = "🔇 BGM OFF";
  }
});

// ===== 키보드 입력 (PC 방향키 해결 핵심) =====
document.addEventListener('keydown', e => {
  if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
    e.preventDefault(); // ⭐ 이 줄이 핵심
  }

  startBGMIfNeeded();

  if (e.key === 'ArrowLeft') key_left = 1;
  if (e.key === 'ArrowRight') key_right = 1;

  if ((e.key === 'r' || e.key === 'R') && gameOver) {
    resetGame();
  }
});

document.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft') key_left = 0;
  if (e.key === 'ArrowRight') key_right = 0;
});

// ===== 모바일 버튼 =====
const btnLeft = document.getElementById("btnLeft");
const btnRight = document.getElementById("btnRight");

btnLeft.addEventListener("touchstart", () => {
  startBGMIfNeeded();
  key_left = 1;
});
btnLeft.addEventListener("touchend", () => key_left = 0);

btnRight.addEventListener("touchstart", () => {
  startBGMIfNeeded();
  key_right = 1;
});
btnRight.addEventListener("touchend", () => key_right = 0);

// ===== 감튀 =====
class Ddong {
  constructor(x, spd) {
    this.x = x;
    this.y = -GAMTI_H;
    this.spd = spd;
  }
  move() {
    this.y += this.spd;
  }
}
let Ddongs = [];

// ===== 충돌 =====
function isCollide(px, py, pw, ph, dx, dy, dw, dh) {
  return !(
    px + pw < dx ||
    px > dx + dw ||
    py + ph < dy ||
    py > dy + dh
  );
}

// ===== 초기화 =====
function resetGame() {
  player_x = canvas.width / 2 - PLAYER_W / 2;
  Ddongs = [];
  t = 0;
  score = 0;
  gameOver = false;
}

// ===== 로직 =====
function step() {
  if (gameOver) return;

  if (key_left && player_x > 0) player_x -= 6;
  if (key_right && player_x < canvas.width - PLAYER_W) player_x += 6;

  t++;
  const level = Math.floor(score / 10);
  const spawnInterval = Math.max(15, 45 - level * 3);
  const count = Math.min(5, 1 + Math.floor(level / 2));

  if (t % spawnInterval === 0) {
    for (let i = 0; i < count; i++) {
      const x = Math.random() * (canvas.width - GAMTI_W);
      const spd = 4 + Math.random() * 4 + level * 0.8;
      Ddongs.push(new Ddong(x, spd));
    }
  }

  Ddongs = Ddongs.filter(d => {
    d.move();

    if (isCollide(player_x, player_y, PLAYER_W, PLAYER_H,
                  d.x, d.y, GAMTI_W, GAMTI_H)) {
      gameOver = true;
      if (score > bestScore) {
        bestScore = score;
        localStorage.setItem("bestScore", bestScore);
      }
    }

    if (d.y > canvas.height) {
      score++;
      return false;
    }
    return true;
  });
}

// ===== 그리기 =====
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(spr_player, player_x, player_y, PLAYER_W, PLAYER_H);

  Ddongs.forEach(d => {
    ctx.drawImage(spr_gamti, d.x, d.y, GAMTI_W, GAMTI_H);
  });

  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText("Score : " + score, 10, 30);
  ctx.fillText("Best : " + bestScore, 10, 55);

  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "40px Arial";
    ctx.fillText("GAME OVER", 60, canvas.height / 2 - 20);
    ctx.font = "20px Arial";
    ctx.fillText("R 키를 눌러 재시작", 85, canvas.height / 2 + 20);
  }
}

// ===== 실행 =====
resetGame();
setInterval(() => {
  step();
  draw();
}, 1000 / FPS);
