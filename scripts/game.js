const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const FPS = 60;

// ===== 크기 =====
const PLAYER_W = 40;
const PLAYER_H = 50;
const GAMTI_W = 15;
const GAMTI_H = 70;

// ===== 상태 =====
let gameState = "TITLE"; // TITLE, COUNTDOWN, PLAY
let gameOver = false;

// ===== 플레이어 =====
let player_x;
const player_y = canvas.height - PLAYER_H - 30;
let key_left = 0;
let key_right = 0;

// ===== 점수 =====
let score = 0;
let bestScore = localStorage.getItem("bestScore") || 0;

// ===== 카운트다운 =====
let countdown = 3;
let countdownTimer = 0;

// ===== 연출 =====
let milestoneText = "";
let milestoneTimer = 0;
let milestoneY = 0;
let flashAlpha = 0;

// ===== BGM =====
const bgm = new Audio("sounds/bgm.mp3");
bgm.loop = true;
bgm.volume = 0.4;
let bgmOn = true;
let bgmStarted = false;

const bgmBtn = document.getElementById("bgmBtn");
bgmBtn.addEventListener("click", () => {
  if (!bgmStarted) {
    bgm.play();
    bgmStarted = true;
  }
  bgmOn = !bgmOn;
  if (bgmOn) {
    bgm.play();
    bgmBtn.textContent = "🔊 BGM ON";
    bgmBtn.classList.remove("off");
  } else {
    bgm.pause();
    bgmBtn.textContent = "🔇 BGM OFF";
    bgmBtn.classList.add("off");
  }
});

// ===== 입력 =====
document.addEventListener("keydown", e => {
  if (["ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault();
  if (e.key === "ArrowLeft") key_left = 1;
  if (e.key === "ArrowRight") key_right = 1;

  if ((e.key === "r" || e.key === "R") && gameOver) resetGame();
});

document.addEventListener("keyup", e => {
  if (e.key === "ArrowLeft") key_left = 0;
  if (e.key === "ArrowRight") key_right = 0;
});

// ===== 모바일 =====
btnLeft.addEventListener("touchstart", () => key_left = 1);
btnLeft.addEventListener("touchend", () => key_left = 0);
btnRight.addEventListener("touchstart", () => key_right = 1);
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
  return !(px + pw < dx || px > dx + dw || py + ph < dy || py > dy + dh);
}

// ===== 난이도 =====
function getSpawnCount(level) {
  const r = Math.random();
  if (level < 2) return r < 0.6 ? 2 : 3;
  if (level < 5) return r < 0.3 ? 2 : r < 0.8 ? 3 : 4;
  if (level < 9) return r < 0.3 ? 3 : r < 0.8 ? 4 : 5;
  return r < 0.3 ? 4 : r < 0.75 ? 5 : 6;
}

// ===== 시작 / 초기화 =====
function startGame() {
  gameState = "COUNTDOWN";
  countdown = 3;
  countdownTimer = 0;
  Ddongs = [];
}

function resetGame() {
  gameState = "TITLE";
  gameOver = false;
  score = 0;
  player_x = canvas.width / 2 - PLAYER_W / 2;
  Ddongs = [];
}

// ===== 클릭 (시작 버튼) =====
canvas.addEventListener("click", e => {
  if (gameState !== "TITLE") return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (x >= 100 && x <= 260 && y >= 450 && y <= 500) {
    if (!bgmStarted && bgmOn) {
      bgm.play();
      bgmStarted = true;
    }
    startGame();
  }
});

// ===== 로직 =====
function step() {
  if (gameState === "TITLE") return;

  if (gameState === "COUNTDOWN") {
    countdownTimer++;
    if (countdownTimer >= FPS) {
      countdown--;
      countdownTimer = 0;
      if (countdown === 0) {
        gameState = "PLAY";
        Ddongs = [];
      }
    }
    return;
  }

  if (gameOver) return;

  if (key_left && player_x > 0) player_x -= 6;
  if (key_right && player_x < canvas.width - PLAYER_W) player_x += 6;

  const level = Math.floor(score / 30);
  const spawnInterval = Math.max(12, 40 - level * 2.5);
  const count = getSpawnCount(level);

  if (Math.random() < 1 / spawnInterval) {
    for (let i = 0; i < count; i++) {
      const x = Math.random() * (canvas.width - GAMTI_W);
      const spd = 4.5 + Math.random() * 4.5 + level * 0.7;
      Ddongs.push(new Ddong(x, spd));
    }
  }

  const minOnScreen = 6 + level * 0.6;
  while (Ddongs.length < minOnScreen) {
    const x = Math.random() * (canvas.width - GAMTI_W);
    const spd = 4.5 + Math.random() * 4.5 + level * 0.7;
    Ddongs.push(new Ddong(x, spd));
  }

  Ddongs = Ddongs.filter(d => {
    d.move();
    if (isCollide(player_x, player_y, PLAYER_W, PLAYER_H, d.x, d.y, GAMTI_W, GAMTI_H)) {
      gameOver = true;
      if (score > bestScore) {
        bestScore = score;
        localStorage.setItem("bestScore", bestScore);
      }
    }
    if (d.y > canvas.height) {
      score++;
      if (score % 100 === 0) {
        milestoneText = score + "점!";
        milestoneTimer = 120;
        milestoneY = canvas.height / 2 + 20;
        flashAlpha = 0.35;
      }
      return false;
    }
    return true;
  });

  if (milestoneTimer > 0) {
    milestoneTimer--;
    milestoneY -= 0.3;
    flashAlpha *= 0.96;
  }
}

// ===== 그리기 =====
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 메인화면
  if (gameState === "TITLE") {
    ctx.drawImage(spr_player, canvas.width / 2 - 80, 200, 160, 200);

    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(50, 120, 260, 70, 15);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#000";
    ctx.font = "18px Arial";
    ctx.fillText("감자튀김을 피하세요!", 85, 165);

    ctx.fillStyle = "#e80028";
    ctx.fillRect(100, 450, 160, 50);
    ctx.fillStyle = "#ffffff";
    ctx.font = "22px Arial";
    ctx.fillText("게임 시작", 125, 485);
    return;
  }

  // 플레이
  ctx.drawImage(spr_player, player_x, player_y, PLAYER_W, PLAYER_H);
  Ddongs.forEach(d => ctx.drawImage(spr_gamti, d.x, d.y, GAMTI_W, GAMTI_H));

  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText("Score : " + score, 10, 30);
  ctx.fillStyle = "#e80028";
  ctx.fillText("Best : " + bestScore, 10, 55);

  if (gameState === "COUNTDOWN") {
    ctx.fillStyle = "red";
    ctx.font = "80px Arial";
    ctx.fillText(countdown, canvas.width / 2 - 20, canvas.height / 2);
  }

  if (milestoneTimer > 0) {
    ctx.fillStyle = "#e80028";
    ctx.font = "36px Arial";
    ctx.fillText(milestoneText, canvas.width / 2 - 50, milestoneY);
    ctx.fillStyle = `rgba(255,197,54,${flashAlpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (gameOver) {
    ctx.fillStyle = "#e80028";
    ctx.font = "40px Arial";
    ctx.fillText("GAME OVER", 60, canvas.height / 2 - 20);
    ctx.font = "20px Arial";
    ctx.fillText("R 키 또는 터치로 재시작", 70, canvas.height / 2 + 20);
  }
}

// ===== 실행 =====
resetGame();
setInterval(() => {
  step();
  draw();
}, 1000 / FPS);
