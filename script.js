// Configuración del juego
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const statusElement = document.getElementById('status');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const video = document.getElementById('video');
const labelContainer = document.getElementById('label-container');

// Variables del juego
const gridSize = 20;
const tileCount = canvas.width / gridSize;
let snake = [
    { x: 15, y: 15 },
    { x: 14, y: 15 },
    { x: 13, y: 15 },
    { x: 12, y: 15 },
    { x: 11, y: 15 }
];
let food = {};
let dx = 0;
let dy = 0;
let score = 0;
let gameRunning = false;
let gamePaused = false;
let gameLoop;

// Variables de Teachable Machine
let model, maxPredictions;
const URL = "https://teachablemachine.withgoogle.com/models/KN2ik_xJ4/";

// Inicializar el juego
function init() {
    generateFood();
    updateScore();
}

// Generar comida en posición aleatoria
function generateFood() {
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
    
    // Asegurar que la comida no esté en la serpiente
    for (let segment of snake) {
        if (segment.x === food.x && segment.y === food.y) {
            generateFood();
            return;
        }
    }
}

// Dibujar el juego
function draw() {
    // Limpiar canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar comida
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize / 2,
        food.y * gridSize + gridSize / 2,
        gridSize / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
    
    // Dibujar serpiente
    snake.forEach((segment, index) => {
        const x = segment.x * gridSize;
        const y = segment.y * gridSize;
        const size = gridSize - 2;
        
        if (index === 0) {
            // Cabeza de la serpiente
            ctx.fillStyle = '#2d8659';
            ctx.beginPath();
            ctx.roundRect(x, y, size, size, 8);
            ctx.fill();
            
            // Sombra en la cabeza
            ctx.fillStyle = '#1e5d3f';
            ctx.beginPath();
            ctx.roundRect(x + 2, y + 2, size - 4, size - 4, 6);
            ctx.fill();
            
            // Ojos de la serpiente
            ctx.fillStyle = '#ffffff';
            const eyeSize = 3;
            const eyeOffset = 5;
            
            // Determinar posición de los ojos según la dirección
            if (dx === 1) { // Derecha
                ctx.fillRect(x + size - eyeOffset - eyeSize, y + eyeOffset, eyeSize, eyeSize);
                ctx.fillRect(x + size - eyeOffset - eyeSize, y + size - eyeOffset - eyeSize, eyeSize, eyeSize);
            } else if (dx === -1) { // Izquierda
                ctx.fillRect(x + eyeOffset, y + eyeOffset, eyeSize, eyeSize);
                ctx.fillRect(x + eyeOffset, y + size - eyeOffset - eyeSize, eyeSize, eyeSize);
            } else if (dy === -1) { // Arriba
                ctx.fillRect(x + eyeOffset, y + eyeOffset, eyeSize, eyeSize);
                ctx.fillRect(x + size - eyeOffset - eyeSize, y + eyeOffset, eyeSize, eyeSize);
            } else if (dy === 1) { // Abajo
                ctx.fillRect(x + eyeOffset, y + size - eyeOffset - eyeSize, eyeSize, eyeSize);
                ctx.fillRect(x + size - eyeOffset - eyeSize, y + size - eyeOffset - eyeSize, eyeSize, eyeSize);
            } else { // Sin movimiento (inicial)
                ctx.fillRect(x + eyeOffset, y + eyeOffset, eyeSize, eyeSize);
                ctx.fillRect(x + size - eyeOffset - eyeSize, y + eyeOffset, eyeSize, eyeSize);
            }
            
            // Pupilas
            ctx.fillStyle = '#000000';
            if (dx === 1) {
                ctx.fillRect(x + size - eyeOffset - eyeSize + 1, y + eyeOffset + 1, 2, 2);
                ctx.fillRect(x + size - eyeOffset - eyeSize + 1, y + size - eyeOffset - eyeSize + 1, 2, 2);
            } else if (dx === -1) {
                ctx.fillRect(x + eyeOffset + 1, y + eyeOffset + 1, 2, 2);
                ctx.fillRect(x + eyeOffset + 1, y + size - eyeOffset - eyeSize + 1, 2, 2);
            } else if (dy === -1) {
                ctx.fillRect(x + eyeOffset + 1, y + eyeOffset + 1, 2, 2);
                ctx.fillRect(x + size - eyeOffset - eyeSize + 1, y + eyeOffset + 1, 2, 2);
            } else if (dy === 1) {
                ctx.fillRect(x + eyeOffset + 1, y + size - eyeOffset - eyeSize + 1, 2, 2);
                ctx.fillRect(x + size - eyeOffset - eyeSize + 1, y + size - eyeOffset - eyeSize + 1, 2, 2);
            } else {
                ctx.fillRect(x + eyeOffset + 1, y + eyeOffset + 1, 2, 2);
                ctx.fillRect(x + size - eyeOffset - eyeSize + 1, y + eyeOffset + 1, 2, 2);
            }
        } else {
            // Cuerpo de la serpiente con patrón
            const bodyColor = index % 2 === 0 ? '#3a9d6f' : '#2d8659';
            ctx.fillStyle = bodyColor;
            ctx.beginPath();
            ctx.roundRect(x, y, size, size, 6);
            ctx.fill();
            
            // Patrón de escamas
            ctx.fillStyle = index % 2 === 0 ? '#2d8659' : '#3a9d6f';
            ctx.beginPath();
            ctx.roundRect(x + 2, y + 2, size - 4, size - 4, 4);
            ctx.fill();
        }
    });
}

// Polyfill para roundRect si no está disponible
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
    };
}

// Actualizar posición de la serpiente
function update() {
    if (gamePaused) return;
    
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    
    // Verificar colisiones con las paredes
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }
    
    // Verificar colisión consigo misma
    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            gameOver();
            return;
        }
    }
    
    snake.unshift(head);
    
    // Verificar si come la comida
    if (head.x === food.x && head.y === food.y) {
        score++;
        updateScore();
        generateFood();
    } else {
        snake.pop();
    }
}

// Cambiar dirección según el gesto detectado
function changeDirection(direction) {
    if (gamePaused || !gameRunning) return;
    
    // Evitar movimiento en dirección opuesta
    switch(direction) {
        case 'up':
            if (dy !== 1) {
                dx = 0;
                dy = -1;
            }
            break;
        case 'down':
            if (dy !== -1) {
                dx = 0;
                dy = 1;
            }
            break;
        case 'left':
            if (dx !== 1) {
                dx = -1;
                dy = 0;
            }
            break;
        case 'right':
            if (dx !== -1) {
                dx = 1;
                dy = 0;
            }
            break;
    }
}

// Actualizar puntuación
function updateScore() {
    scoreElement.textContent = score;
}

// Game Over
function gameOver() {
    gameRunning = false;
    gamePaused = false;
    statusElement.textContent = '¡Juego terminado! Puntuación: ' + score;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    clearInterval(gameLoop);
    
    // Resetear juego
    snake = [
        { x: 15, y: 15 },
        { x: 14, y: 15 },
        { x: 13, y: 15 },
        { x: 12, y: 15 },
        { x: 11, y: 15 }
    ];
    dx = 0;
    dy = 0;
    score = 0;
    updateScore();
    generateFood();
}

// Iniciar juego
function startGame() {
    if (gameRunning) return;
    
    gameRunning = true;
    gamePaused = false;
    statusElement.textContent = 'Juego en curso';
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    
    // Iniciar bucle del juego
    gameLoop = setInterval(() => {
        update();
        draw();
    }, 400);
}

// Pausar/Reanudar juego
function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    if (gamePaused) {
        statusElement.textContent = 'Juego pausado';
        pauseBtn.textContent = 'Reanudar';
    } else {
        statusElement.textContent = 'Juego en curso';
        pauseBtn.textContent = 'Pausar';
    }
}

// Inicializar Teachable Machine
async function initTM() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    try {
        statusElement.textContent = 'Cargando modelo...';
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
        statusElement.textContent = 'Modelo cargado. Iniciando cámara...';
        
        // Iniciar webcam
        await startWebcam();
        
        // Iniciar predicción
        loop();
        
        statusElement.textContent = 'Listo para jugar. Haz clic en "Iniciar Juego"';
    } catch (error) {
        console.error('Error al cargar el modelo:', error);
        statusElement.textContent = 'Error al cargar el modelo. Verifica la conexión.';
    }
}

// Iniciar webcam
async function startWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 320, height: 240 }
        });
        video.srcObject = stream;
        await video.play();
    } catch (error) {
        console.error('Error al acceder a la cámara:', error);
        statusElement.textContent = 'Error al acceder a la cámara. Permite el acceso a la cámara.';
    }
}

// Loop de predicción
async function loop() {
    if (!model) return;
    
    await predict();
    window.requestAnimationFrame(loop);
}

// Realizar predicción
async function predict() {
    if (!model || !video.videoWidth) return;
    
    const prediction = await model.predict(video);
    
    // Encontrar la clase con mayor probabilidad
    let maxProbability = 0;
    let predictedClass = '';
    
    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction = prediction[i];
        const probability = classPrediction.probability;
        
        if (probability > maxProbability && probability > 0.7) {
            maxProbability = probability;
            predictedClass = classPrediction.className;
        }
    }
    
    // Mostrar predicciones
    let labelContainerHTML = '';
    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction = prediction[i];
        labelContainerHTML += `
            <div style="margin: 5px 0;">
                <span style="font-weight: bold;">${classPrediction.className}:</span>
                <span>${(classPrediction.probability * 100).toFixed(2)}%</span>
            </div>
        `;
    }
    labelContainer.innerHTML = labelContainerHTML;
    
    // Mapear clases a direcciones
    if (predictedClass) {
        const directionMap = {
            'Flecha arriba': 'up',
            'Flecha abajo': 'down',
            'Flecha a la izquierda': 'left',
            'Flecha izquierda': 'left',
            'Izquierda': 'left',
            'Flecha a la derecha': 'right',
            'Flecha derecha': 'right',
            'Derecha': 'right'
        };
        
        const direction = directionMap[predictedClass];
        if (direction) {
            changeDirection(direction);
        }
    }
}

// Event listeners
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);

// Inicializar
init();
initTM();
draw();

