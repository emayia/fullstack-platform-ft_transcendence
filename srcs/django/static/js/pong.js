const canvas = document.getElementById("pong");
const context = canvas.getContext("2d");

canvas.width = 950;
canvas.height = 620;

let serverState = {
	mode: null,
	running: false,
	game_over: false,
	winner: null,
	score_left: 0,
	score_right: 0,
	ball_x: canvas.width / 2,
	ball_y: canvas.height / 2,
	ball_dx: 0,
	ball_dy: 0,
	left_paddle_y: canvas.height / 2 - 65,
	right_paddle_y: canvas.height / 2 - 65
};

let currentTheme = localStorage.getItem('selectedTheme') || 'clouds';
let ball = {
	x: canvas.width / 2,
	y: canvas.height / 2,
	radius: 10,
};

let isPaused = false;
const keysPressed = new Set();
let isAnimating = false;
let pongSocket = null;
let pauseOverlay = null;
let isPauseOverlayVisible = false;

const CONTROLS = {
	PLAYER1_UP: ['w'],
	PLAYER1_DOWN: ['s'],
	PLAYER2_UP: ['ArrowUp'],
	PLAYER2_DOWN: ['ArrowDown']
};

let lastMoveTime = {
	left: 0,
	right: 0
};
const MOVE_DELAY = 16;

function handleContinuousMovement(timestamp) {
	if (!pongSocket || !serverState.running || serverState.game_over || isPaused) return;

	const currentTime = timestamp || performance.now();

	keysPressed.forEach(key => {
		if (serverState.mode === "local") {
			if (CONTROLS.PLAYER1_UP.includes(key) || CONTROLS.PLAYER1_DOWN.includes(key)) {
				if (currentTime - lastMoveTime.left >= MOVE_DELAY) {
					if (CONTROLS.PLAYER1_UP.includes(key)) {
						pongSocket.send(JSON.stringify({ 
							action: "movePaddle", 
							player: "left", 
							direction: "up" 
						}));
					} else {
						pongSocket.send(JSON.stringify({ 
							action: "movePaddle", 
							player: "left", 
							direction: "down" 
						}));
					}
					lastMoveTime.left = currentTime;
				}
			}
			
			if (CONTROLS.PLAYER2_UP.includes(key) || CONTROLS.PLAYER2_DOWN.includes(key)) {
				if (currentTime - lastMoveTime.right >= MOVE_DELAY) {
					if (CONTROLS.PLAYER2_UP.includes(key)) {
						pongSocket.send(JSON.stringify({ 
							action: "movePaddle", 
							player: "right", 
							direction: "up" 
						}));
					} else {
						pongSocket.send(JSON.stringify({ 
							action: "movePaddle", 
							player: "right", 
							direction: "down" 
						}));
					}
					lastMoveTime.right = currentTime;
				}
			}
		}
		else if (serverState.mode === "ai") {
			if (currentTime - lastMoveTime.left >= MOVE_DELAY) {
				if (CONTROLS.PLAYER1_UP.includes(key) || 
					(CONTROLS.PLAYER2_UP.includes(key) && !CONTROLS.PLAYER1_DOWN.includes(key))) {
					pongSocket.send(JSON.stringify({ 
						action: "movePaddle", 
						player: "left", 
						direction: "up" 
					}));
					lastMoveTime.left = currentTime;
				}
				else if (CONTROLS.PLAYER1_DOWN.includes(key) || 
						 (CONTROLS.PLAYER2_DOWN.includes(key) && !CONTROLS.PLAYER1_UP.includes(key))) {
					pongSocket.send(JSON.stringify({ 
						action: "movePaddle", 
						player: "left", 
						direction: "down" 
					}));
					lastMoveTime.left = currentTime;
				}
			}
		}
	});

	if (keysPressed.size > 0) {
		requestAnimationFrame(handleContinuousMovement);
	} else {
		isAnimating = false;
	}
}

function createPauseOverlay() {
	const existingOverlay = document.getElementById('pause-overlay');
	if (existingOverlay) {
		existingOverlay.remove();
	}

	pauseOverlay = document.createElement('div');
	pauseOverlay.id = 'pause-overlay';
	pauseOverlay.style.cssText = `
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		display: none;
		justify-content: center;
		align-items: center;
		color: white;
		font-size: 48px;
		font-family: Inter;
		z-index: 1000;
	`;
	pauseOverlay.textContent = `${translations.Paused}`;
	
	const pongContainer = document.getElementById('pong-container');
	if (pongContainer) {
		pongContainer.appendChild(pauseOverlay);
	}
	
	return pauseOverlay;
}

function showPauseScreen() {
	if (!pauseOverlay) {
		pauseOverlay = createPauseOverlay();
	}
	
	if (!isPauseOverlayVisible) {
		pauseOverlay.style.display = 'flex';
		isPauseOverlayVisible = true;
	}
}

function hidePauseScreen() {
	if (isPauseOverlayVisible && pauseOverlay) {
		pauseOverlay.style.display = 'none';
		isPauseOverlayVisible = false;
	}
}

function draw() {
	if (!serverState) return;
	
	if (typeof window.updateGameObjects === 'function') {
		window.updateGameObjects(serverState);
	}
	
	updateScoreDisplay(serverState.score_left, serverState.score_right);

	if (isPaused) {
		showPauseScreen();
	} else {
		hidePauseScreen();
	}
}

function updateScoreDisplay(leftScore, rightScore) {
	const leftScoreElement = document.querySelector('#current-player-score');
	const rightScoreElement = document.querySelector('#opponent-score');
	if (leftScoreElement) leftScoreElement.textContent = leftScore;
	if (rightScoreElement) rightScoreElement.textContent = rightScore;
}

function showVictoryScreen(winner, mode) {
	const victoryScreen = document.getElementById('victory-screen');
	const winnerPic = document.getElementById('winner-pic');
	const winnerMsg = document.getElementById('winner-msg');

	let displayMsg = '';
	let winnerImage = '';

	if (window.tournamentState && window.tournamentState.isActive) {
		const championIdx = window.tournamentState.currentChampionIdx;
		const challengerIdx = window.tournamentState.nextChallengerIdx;
		const winnerAlias = window.tournamentState.participants[
			winner === 'Left Player' ? championIdx : challengerIdx
		].alias;
		displayMsg = `${winnerAlias} ${translations.won}`;
		winnerImage = profilePicDefault;
	}
	else if (mode === 'ai') {
		if (winner === 'Left Player') {
			if (currentUser && currentUser.image_url) {
				winnerImage = currentUser.image_url;
				displayMsg = `@${currentUser.username} ${translations.won}`;
			} else {
				winnerImage = profilePicDefault;
				displayMsg = `${translations.youWon}`;
			}
		} else {
			winnerImage = botOpponentPic;
			displayMsg = `${translations.AIWon}`;
		}
	} else if (mode === 'local') {
		winnerImage = profilePicDefault;
		displayMsg = winner === 'Left Player' ? `${translations.P1Won}` : `${translations.P2Won}`;
	}

	winnerPic.src = winnerImage;
	winnerMsg.textContent = displayMsg;
	victoryScreen.classList.remove('hidden');
}

function openPongWebSocket(gameId, mode) {
	if (pongSocket) {
		pongSocket.onclose = null;
		pongSocket.close();
		pongSocket = null;
	}

	keysPressed.clear();
	isAnimating = false;
	isPaused = false;
	lastMoveTime = {
		left: 0,
		right: 0
	};

	serverState = {
		mode: null,
		running: false,
		game_over: false,
		winner: null,
		score_left: 0,
		score_right: 0,
		ball_x: canvas.width / 2,
		ball_y: canvas.height / 2,
		ball_dx: 0,
		ball_dy: 0,
		left_paddle_y: canvas.height / 2 - 65,
		right_paddle_y: canvas.height / 2 - 65
	};

	ball = {
		x: canvas.width / 2,
		y: canvas.height / 2,
		radius: 10,
	};

	const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
	const wsUrl = `${protocol}//${window.location.host}/ws/pong/${gameId}/`;

	pongSocket = new WebSocket(wsUrl);

	pongSocket.onopen = () => {
		const startMsg = { action: "startGame", mode: mode };
		pongSocket.send(JSON.stringify(startMsg));
		pongSocket.send(JSON.stringify({ action: "getStatus" }));
	};

	pongSocket.onmessage = (event) => {
		const data = JSON.parse(event.data);
		handleServerUpdate(data);
	};

	pongSocket.onerror = (err) => {
		console.error("Pong WebSocket error:", err);
	};

	pongSocket.onclose = () => {
		pongSocket = null;
		if (window.isInGame) {
			setTimeout(() => {
				if (!pongSocket) {
					openPongWebSocket(gameId, mode);
				}
			}, 3000);
		}
	};
}

function handleServerUpdate(state) {
	serverState = state;

	if (isPaused !== state.is_paused) {
		isPaused = state.is_paused;
	}

	if (state.running && !state.game_over) {
		const rightPicContainer = document.querySelector('.player-pic-container.opponent');
		const leftPicContainer = document.querySelector('.player-pic-container');
		const leftLabel = document.querySelector('#player-label-left');
		const rightLabel = document.querySelector('#player-label-right');
		
		if (rightPicContainer && leftPicContainer && leftLabel && rightLabel) {
			if (state.mode === 'ai') {
				leftPicContainer.style.display = 'block';
				rightPicContainer.style.display = 'block';
				leftLabel.textContent = '';
				rightLabel.textContent = '';
				
				rightPicContainer.innerHTML = '';
				const opponentImg = document.createElement('img');
				opponentImg.src = botOpponentPic;
				opponentImg.alt = 'AI opponent';
				rightPicContainer.appendChild(opponentImg);

			} else if (state.mode === 'local') {
				if (window.tournamentState && window.tournamentState.isActive) {
					// Do nothing here, so tournament.js can manage aliases
				} else {
					leftPicContainer.style.display = 'none';
					rightPicContainer.style.display = 'none';
					leftLabel.textContent = 'P1';
					rightLabel.textContent = 'P2';
				}
			}
		}
	}

	if (state.game_over) {
		window.isInGame = false;
		showVictoryScreen(state.winner, state.mode);
		if (window.updateExitButtonsVisibility) {
			window.updateExitButtonsVisibility();
		}
		return;
	}

	ball.x = state.ball_x;
	ball.y = state.ball_y;
	draw();
}


async function exitCurrentGame() {
	if (!pongSocket) return;
	
	if (pauseOverlay) {
		pauseOverlay.remove();
		pauseOverlay = null;
		isPauseOverlayVisible = false;
	}

	pongSocket.send(JSON.stringify({ action: "exitGame" }));

	keysPressed.clear();
	isAnimating = false;
	isPaused = false;
	lastMoveTime = {
		left: 0,
		right: 0
	};
	
	serverState = {
		mode: null,
		running: false,
		game_over: false,
		winner: null,
		score_left: 0,
		score_right: 0,
		ball_x: canvas.width / 2,
		ball_y: canvas.height / 2,
		ball_dx: 0,
		ball_dy: 0,
		left_paddle_y: canvas.height / 2 - 65,
		right_paddle_y: canvas.height / 2 - 65
	};

	ball = {
		x: canvas.width / 2,
		y: canvas.height / 2,
		radius: 10,
	};

	window.isInGame = false;
	document.dispatchEvent(new Event('gameEnded'));

	if (typeof window.updateExitButtonsVisibility === 'function') {
		window.updateExitButtonsVisibility();
	}

	const settingsBtn = document.querySelector('.settings-btn');
	const scoreCard = document.querySelector('.score-card');
	if (settingsBtn) {
		settingsBtn.classList.remove('rotated');
	}
	if (scoreCard) {
		scoreCard.classList.remove('settings-active');
	}
}


let isShiftPressed = false;

document.addEventListener("keydown", function(event) {
	if (event.key === "Shift") {
		isShiftPressed = true;
		return;
	}

	if (event.key === " " && serverState.running && !serverState.game_over) {
		isPaused = !isPaused;

		if (pongSocket) {
			const action = isPaused ? 'pauseGame' : 'unpauseGame';
			pongSocket.send(JSON.stringify({ action: action }));
			
			if (isPaused) {
				keysPressed.clear();
				isAnimating = false;
			} else {
				if (keysPressed.size > 0) {
					isAnimating = true;
					requestAnimationFrame(handleContinuousMovement);
				}
			}
		}
		
		draw();
		return;
	}

	if (!isPaused) {
		let keyToCheck;
		if (event.key.startsWith('Arrow')) {
			keyToCheck = event.key;
		} else {
			keyToCheck = event.key.toLowerCase();
		}

		const isControlKey = Object.values(CONTROLS).some(controls => 
			controls.includes(keyToCheck)
		);
		
		if (isControlKey) {
			keysPressed.add(keyToCheck);

			if (!isAnimating) {
				isAnimating = true;
				requestAnimationFrame(handleContinuousMovement);
			}
		}
	}
});

document.addEventListener("keyup", function(event) {
	if (event.key === "Shift") {
		isShiftPressed = false;
		return;
	}

	let keyToCheck;
	if (event.key.startsWith('Arrow')) {
		keyToCheck = event.key;
	} else {
		keyToCheck = event.key.toLowerCase();
	}
	
	keysPressed.delete(keyToCheck);

	if (keysPressed.size === 0) {
		isAnimating = false;
	}
});

document.addEventListener('themeChange', (event) => {
	currentTheme = event.detail.theme;
});

window.openPongWebSocket = openPongWebSocket;
window.exitCurrentGame = exitCurrentGame;
window.draw = draw;
