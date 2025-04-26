const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score-display');
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');

// Set canvas size
canvas.width = 400;
canvas.height = 600;

// Bird class
class Bird {
    constructor() {
        this.x = 50;
        this.y = canvas.height / 2;
        this.width = 40;
        this.height = 30;
        this.gravity = 0.5;
        this.velocity = 0;
        this.jumpForce = -10;
        this.rotation = 0;
        this.wingFrame = 0;
        this.wingFrameCount = 3;
        this.wingAnimationSpeed = 5;
        this.frameCount = 0;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        // Rotate based on velocity
        this.rotation = Math.min(Math.max(this.velocity * 2, -45), 45);
        ctx.rotate(this.rotation * Math.PI / 180);

        // Draw bird body
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw wing
        ctx.fillStyle = '#c0392b';
        this.frameCount++;
        if (this.frameCount % this.wingAnimationSpeed === 0) {
            this.wingFrame = (this.wingFrame + 1) % this.wingFrameCount;
        }
        
        const wingHeight = this.height / 3;
        const wingOffset = -wingHeight + (this.wingFrame * 2);
        ctx.beginPath();
        ctx.ellipse(-5, wingOffset, this.width / 4, wingHeight, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.width / 4, -this.height / 6, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.width / 4 + 2, -this.height / 6, 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw beak
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.moveTo(this.width / 2, 0);
        ctx.lineTo(this.width / 2 + 15, -5);
        ctx.lineTo(this.width / 2 + 15, 5);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    update() {
        this.velocity += this.gravity;
        this.y += this.velocity;
    }

    jump() {
        this.velocity = this.jumpForce;
    }
}

// Pipe class
class Pipe {
    constructor() {
        this.width = 80;
        this.gap = 150;
        this.x = canvas.width;
        this.topHeight = Math.floor(Math.random() * (canvas.height - this.gap - 100)) + 50;
        this.bottomHeight = canvas.height - this.topHeight - this.gap;
        this.passed = false;
        this.speed = 3;
    }

    draw() {
        // Draw top pipe
        this.drawPipe(this.x, 0, this.width, this.topHeight, true);
        
        // Draw bottom pipe
        this.drawPipe(this.x, canvas.height - this.bottomHeight, this.width, this.bottomHeight, false);
    }

    drawPipe(x, y, width, height, isTop) {
        const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
        gradient.addColorStop(0, '#2c3e50');
        gradient.addColorStop(0.5, '#34495e');
        gradient.addColorStop(1, '#2c3e50');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);

        // Pipe border
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Pipe cap
        const capHeight = 20;
        const capWidth = width + 20;
        const capX = x - 10;
        
        const capGradient = ctx.createLinearGradient(capX, 0, capX + capWidth, 0);
        capGradient.addColorStop(0, '#1a1a1a');
        capGradient.addColorStop(0.5, '#2c3e50');
        capGradient.addColorStop(1, '#1a1a1a');
        
        ctx.fillStyle = capGradient;
        if (isTop) {
            ctx.fillRect(capX, y + height - capHeight, capWidth, capHeight);
        } else {
            ctx.fillRect(capX, y, capWidth, capHeight);
        }
    }

    update() {
        this.x -= this.speed;
    }
}

// Game variables
const bird = new Bird();
const pipes = [];
const pipeSpawnInterval = 1500;
let gameStarted = false;
let score = 0;
let lastPipeSpawn = 0;
let animationFrameId;

// Event listeners
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && gameStarted) {
        bird.jump();
    }
});

document.addEventListener('click', () => {
    if (gameStarted) {
        bird.jump();
    }
});

startButton.addEventListener('click', startGame);

function startGame() {
    gameStarted = true;
    score = 0;
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    pipes.length = 0;
    startScreen.style.display = 'none';
    scoreDisplay.textContent = `Score: ${score}`;
    gameLoop();
}

function updatePipes() {
    const currentTime = Date.now();
    if (currentTime - lastPipeSpawn > pipeSpawnInterval) {
        pipes.push(new Pipe());
        lastPipeSpawn = currentTime;
    }

    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].update();

        if (!pipes[i].passed && pipes[i].x + pipes[i].width < bird.x) {
            pipes[i].passed = true;
            score++;
            scoreDisplay.textContent = `Score: ${score}`;
        }

        if (pipes[i].x + pipes[i].width < 0) {
            pipes.splice(i, 1);
            continue;
        }

        if (checkCollision(pipes[i])) {
            gameOver();
        }
    }
}

function checkCollision(pipe) {
    const birdRight = bird.x + bird.width;
    const birdBottom = bird.y + bird.height;
    
    // Adjust collision box to be slightly smaller than visual size
    const collisionMargin = 5;
    const birdCollisionBox = {
        x: bird.x + collisionMargin,
        y: bird.y + collisionMargin,
        width: bird.width - collisionMargin * 2,
        height: bird.height - collisionMargin * 2
    };

    // Check collision with pipes
    if (birdCollisionBox.x + birdCollisionBox.width > pipe.x && 
        birdCollisionBox.x < pipe.x + pipe.width) {
        if (birdCollisionBox.y < pipe.topHeight || 
            birdCollisionBox.y + birdCollisionBox.height > pipe.topHeight + pipe.gap) {
            return true;
        }
    }

    return false;
}

function gameOver() {
    gameStarted = false;
    startScreen.style.display = 'block';
    cancelAnimationFrame(animationFrameId);
}

function draw() {
    // Draw background
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 50; i++) {
        const x = (Date.now() / 50 + i * 100) % canvas.width;
        const y = (Math.sin(Date.now() / 1000 + i) * 10) + (i * 12) % canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw pipes
    pipes.forEach(pipe => pipe.draw());

    // Draw bird
    bird.draw();
}

function gameLoop() {
    if (!gameStarted) return;

    bird.update();
    updatePipes();
    draw();

    // Check if bird hits the ground or ceiling
    if (bird.y + bird.height > canvas.height || bird.y < 0) {
        gameOver();


        // In the gameOver function, add this before the cancelAnimationFrame line:
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('highScore', highScore);
      document.querySelector('.high-score').textContent = `Best: ${highScore}`;
    }
        return;
    }

    animationFrameId = requestAnimationFrame(gameLoop);
}

// Initialize game
startScreen.style.display = 'block';