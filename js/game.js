// Game Configuration
const CONFIG = {
    totalPairs: 12,
    imagesPath: 'images/',
    imageExtension: '.png'
};

// Game State
let gameState = {
    started: false,
    timer: 0,
    moves: 0,
    matches: 0,
    flippedCards: [],
    canFlip: true,
    timerInterval: null,
    scores: [],
    musicPlaying: false
};

// DOM Elements
const elements = {
    gameBoard: document.getElementById('gameBoard'),
    timer: document.getElementById('timer'),
    moves: document.getElementById('moves'),
    matches: document.getElementById('matches'),
    score: document.getElementById('score'),
    newGameBtn: document.getElementById('newGameBtn'),
    hintBtn: document.getElementById('hintBtn'),
    gameLobbyBtn: document.getElementById('gameLobbyBtn'), // TAMBAHAN BARU
    winMessage: document.getElementById('winMessage'),
    finalTime: document.getElementById('finalTime'),
    finalMoves: document.getElementById('finalMoves'),
    finalScore: document.getElementById('finalScore'),
    playAgainBtn: document.getElementById('playAgainBtn'),
    shareBtn: document.getElementById('shareBtn'),
    hintModal: document.getElementById('hintModal'),
    closeHintBtn: document.getElementById('closeHintBtn'),
    musicToggle: document.getElementById('musicToggle'),
    musicStatus: document.getElementById('musicStatus'),
    volumeSlider: document.getElementById('volumeSlider')
};

// Audio elements
const sounds = {
    flip: document.getElementById('flipSound'),
    match: document.getElementById('matchSound'),
    win: document.getElementById('winSound'),
    bgMusic: document.getElementById('bgMusic')
};

// Initialize game
function initGame() {
    createCards();
    updateStats();
    attachEventListeners();
    setupMusic();
    updateScoreDisplay();
}

// Setup background music
function setupMusic() {
    // Set initial volume
    sounds.bgMusic.volume = elements.volumeSlider.value / 100;
    
    // Try to autoplay with user gesture
    document.addEventListener('click', function initMusic() {
        if (!gameState.musicPlaying) {
            playBackgroundMusic();
        }
        document.removeEventListener('click', initMusic);
    }, { once: true });
}

// Create card elements using LOCAL images only
function createCards() {
    elements.gameBoard.innerHTML = '';
    
    // Create array of image names (each image appears twice)
    let imageNames = [];
    for (let i = 1; i <= CONFIG.totalPairs; i++) {
        imageNames.push(`aru${i}`);
        imageNames.push(`aru${i}`);
    }
    
    // Shuffle the images
    imageNames = shuffleArray(imageNames);
    
    // Create cards
    imageNames.forEach((imageName, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.image = imageName;
        card.dataset.index = index;
        
        // Front side with LOCAL image
        const front = document.createElement('div');
        front.className = 'card-front';
        
        const img = document.createElement('img');
        // Using LOCAL images only - no external URLs
        img.src = `${CONFIG.imagesPath}${imageName}${CONFIG.imageExtension}`;
        img.alt = `Karuu Memory #${imageName.replace('aru', '')}`;
        img.loading = 'lazy';
        
        front.appendChild(img);
        
        // Back side with heart icon
        const back = document.createElement('div');
        back.className = 'card-back';
        back.innerHTML = '<i class="fas fa-heart"></i>';
        
        card.appendChild(front);
        card.appendChild(back);
        
        // Add click event
        card.addEventListener('click', () => flipCard(card));
        
        elements.gameBoard.appendChild(card);
    });
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Start game timer
function startTimer() {
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    
    gameState.timer = 0;
    updateTimerDisplay();
    
    gameState.timerInterval = setInterval(() => {
        gameState.timer++;
        updateTimerDisplay();
        updateScoreDisplay();
    }, 1000);
}

// Update timer display
function updateTimerDisplay() {
    elements.timer.textContent = `${gameState.timer}s`;
}

// Update game stats display
function updateStats() {
    elements.moves.textContent = gameState.moves;
    elements.matches.textContent = `${gameState.matches}/${CONFIG.totalPairs}`;
}

// Update score display
function updateScoreDisplay() {
    const score = calculateScore();
    elements.score.textContent = score;
}

// Flip a card
function flipCard(card) {
    // Check if card can be flipped
    if (!gameState.canFlip || 
        card.classList.contains('flipped') || 
        card.classList.contains('matched') ||
        gameState.flippedCards.includes(card)) {
        return;
    }
    
    // Start timer on first flip
    if (!gameState.started) {
        gameState.started = true;
        startTimer();
    }
    
    // Play flip sound
    playSound(sounds.flip);
    
    // Flip the card
    card.classList.add('flipped');
    gameState.flippedCards.push(card);
    
    // Check for match when two cards are flipped
    if (gameState.flippedCards.length === 2) {
        gameState.canFlip = false;
        gameState.moves++;
        updateStats();
        updateScoreDisplay();
        
        const [card1, card2] = gameState.flippedCards;
        
        if (card1.dataset.image === card2.dataset.image) {
            // Match found
            setTimeout(() => {
                card1.classList.add('matched');
                card2.classList.add('matched');
                gameState.flippedCards = [];
                gameState.canFlip = true;
                
                gameState.matches++;
                updateStats();
                updateScoreDisplay();
                
                // Play match sound
                playSound(sounds.match);
                
                // Check for win
                if (gameState.matches === CONFIG.totalPairs) {
                    endGame();
                }
            }, 600);
        } else {
            // No match
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                gameState.flippedCards = [];
                gameState.canFlip = true;
            }, 1000);
        }
    }
}

// End the game
function endGame() {
    clearInterval(gameState.timerInterval);
    
    // Calculate score
    const score = calculateScore();
    
    // Update final stats
    elements.finalTime.textContent = gameState.timer;
    elements.finalMoves.textContent = gameState.moves;
    elements.finalScore.textContent = score;
    
    // Save score
    gameState.scores.push({
        time: gameState.timer,
        moves: gameState.moves,
        score: score,
        date: new Date().toLocaleDateString()
    });
    
    // Play win sound
    setTimeout(() => {
        playSound(sounds.win);
        elements.winMessage.classList.add('active');
    }, 800);
}

// Calculate current score
function calculateScore() {
    // Base score
    let score = 1000;
    
    // Deductions for time and moves
    score -= gameState.timer * 2;
    score -= gameState.moves * 5;
    
    // Bonus for matches
    score += gameState.matches * 20;
    
    // Minimum score
    return Math.max(100, score);
}

// Reset game
function resetGame() {
    clearInterval(gameState.timerInterval);
    
    gameState = {
        started: false,
        timer: 0,
        moves: 0,
        matches: 0,
        flippedCards: [],
        canFlip: true,
        timerInterval: null,
        scores: gameState.scores,
        musicPlaying: gameState.musicPlaying
    };
    
    updateStats();
    updateTimerDisplay();
    updateScoreDisplay();
    
    // Close all modals
    elements.winMessage.classList.remove('active');
    elements.hintModal.classList.remove('active');
    
    // Recreate cards
    createCards();
}

// Play sound effect
function playSound(soundElement) {
    if (soundElement) {
        soundElement.currentTime = 0;
        soundElement.play().catch(e => console.log("Audio play failed:", e));
    }
}

// Play background music
function playBackgroundMusic() {
    sounds.bgMusic.play()
        .then(() => {
            gameState.musicPlaying = true;
            elements.musicStatus.textContent = 'Pause Music';
            elements.musicToggle.innerHTML = '<i class="fas fa-pause"></i> Pause Music';
        })
        .catch(e => {
            console.log("Background music play failed:", e);
            elements.musicStatus.textContent = 'Play Music (click to enable)';
        });
}

// Pause background music
function pauseBackgroundMusic() {
    sounds.bgMusic.pause();
    gameState.musicPlaying = false;
    elements.musicStatus.textContent = 'Play Music';
    elements.musicToggle.innerHTML = '<i class="fas fa-music"></i> Play Music';
}

// Toggle background music
function toggleBackgroundMusic() {
    if (gameState.musicPlaying) {
        pauseBackgroundMusic();
    } else {
        playBackgroundMusic();
    }
}

// Attach event listeners
function attachEventListeners() {
    // New game button
    elements.newGameBtn.addEventListener('click', resetGame);
    
    // Hint button
    elements.hintBtn.addEventListener('click', () => {
        elements.hintModal.classList.add('active');
    });
    
    // Game Lobby button - TAMBAHAN BARU
    elements.gameLobbyBtn.addEventListener('click', () => {
        window.location.href = 'pages/index.html';
    });
    
    // Play again button
    elements.playAgainBtn.addEventListener('click', () => {
        elements.winMessage.classList.remove('active');
        resetGame();
    });
    
    // Close hint button
    elements.closeHintBtn.addEventListener('click', () => {
        elements.hintModal.classList.remove('active');
    });
    
    // Share button
    elements.shareBtn.addEventListener('click', () => {
        const shareText = `I just completed the Sister's Memory Game with ${gameState.moves} moves in ${gameState.timer} seconds! Score: ${calculateScore()} points. Happy Birthday Sister Karuu!`;
        
        if (navigator.share) {
            navigator.share({
                title: "Sister's Memory Game - Birthday Gift",
                text: shareText,
                url: window.location.href
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                alert('Text copied to clipboard!');
            });
        }
    });
    
    // Music toggle button
    elements.musicToggle.addEventListener('click', toggleBackgroundMusic);
    
    // Volume slider
    elements.volumeSlider.addEventListener('input', (e) => {
        const volume = e.target.value / 100;
        sounds.bgMusic.volume = volume;
        sounds.flip.volume = volume;
        sounds.match.volume = volume;
        sounds.win.volume = volume;
    });
    
    // Close modals when clicking outside
    [elements.winMessage, elements.hintModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        elements.winMessage.classList.remove('active');
        elements.hintModal.classList.remove('active');
    }
    
    if (e.key === 'r' || e.key === 'R') {
        resetGame();
    }
    
    if (e.key === 'h' || e.key === 'H') {
        elements.hintModal.classList.add('active');
    }
    
    if (e.key === 'm' || e.key === 'M') {
        toggleBackgroundMusic();
    }
    
    if (e.key === 'g' || e.key === 'G') {
        window.location.href = 'pages/index.html';
    }
});

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', initGame);

// Service Worker for PWA (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registered');
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}

// Navigasi ke Game Lobby (sudah ada di game.js)
elements.gameLobbyBtn.addEventListener('click', () => {
    window.location.href = 'pages/index.html';
});