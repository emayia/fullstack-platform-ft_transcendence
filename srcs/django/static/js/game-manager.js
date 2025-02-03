let is3DInitialized = false;

function initGameManager() {
	console.log('Initializing game manager...');

	document.addEventListener('userLoaded', handleUserLogin);
	document.addEventListener('userLoggedOut', handleUserLogout);
	
	document.addEventListener('gameStarted', handleGameStart);
	document.addEventListener('gameEnded', handleGameEnd);
}

async function handleUserLogin(event) {
	console.log('User logged in, checking 3D initialization...');
	
	if (!is3DInitialized && window.init3DRenderer) {
		try {
			await window.init3DRenderer();
			is3DInitialized = true;
			console.log('3D renderer initialized successfully');
			
			const pongContainer = document.getElementById('pong-container');
			if (pongContainer) {
				pongContainer.classList.add('hidden');
			}
			
			const gameCard = document.querySelector('.game-card');
			if (gameCard) {
				gameCard.classList.remove('hidden');
			}
		} catch (error) {
			console.error('Failed to initialize 3D renderer:', error);
		}
	}
}

async function handleUserLogout() {
	console.log('User logged out, cleaning up 3D...');
	
	if (is3DInitialized && window.dispose3D) {
		try {
			await window.dispose3D();
			is3DInitialized = false;
			console.log('3D renderer disposed successfully');
		} catch (error) {
			console.error('Error disposing 3D renderer:', error);
		}
	}

	const pongContainer = document.getElementById('pong-container');
	const gameCard = document.querySelector('.game-card');
	
	if (pongContainer) pongContainer.classList.add('hidden');
	if (gameCard) gameCard.classList.add('hidden');
}

function handleGameStart() {
	console.log('Game starting, updating visibility...');
	
	const gameCard = document.querySelector('.game-card');
	if (gameCard) {
		gameCard.classList.add('hidden');
	}
	
	const pongContainer = document.getElementById('pong-container');
	if (pongContainer) {
		pongContainer.classList.remove('hidden');
	}
	
	if (window.reset3DSceneForNewMatch) {
		window.reset3DSceneForNewMatch();
	}
}

function handleGameEnd() {
	console.log('Game ended, restoring game mode selection...');
	
	const pongContainer = document.getElementById('pong-container');
	if (pongContainer) {
		pongContainer.classList.add('hidden');
	}

	const gameCard = document.querySelector('.game-card');
	if (gameCard) {
		gameCard.classList.remove('hidden');
	}
}

window.gameManager = {
	init: initGameManager,
	is3DInitialized: () => is3DInitialized
};

document.addEventListener('DOMContentLoaded', initGameManager);
