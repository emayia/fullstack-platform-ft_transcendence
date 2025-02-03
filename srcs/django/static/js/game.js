window.isInGame = false;
window.currentGameMode = null;
window.currentGameId = null;
let lastGameSwitchTime = 0;
const MIN_GAME_SWITCH_INTERVAL = 500;

document.addEventListener('DOMContentLoaded', () => {
	window.updateExitButtonsVisibility();

	const settingsBtn = document.querySelector('.settings-btn');
	const scoreCard = document.querySelector('.score-card');
	if (settingsBtn && scoreCard) {
		settingsBtn.addEventListener('click', () => {
			settingsBtn.classList.toggle('rotated');
			scoreCard.classList.toggle('settings-active');
		});
	}
});

async function startNewPongGame(mode) {
	console.log("Starting new game, mode:", mode);
	
	const now = Date.now();
	if (now - lastGameSwitchTime < MIN_GAME_SWITCH_INTERVAL) {
		console.log("Game switch requested too soon, waiting...");
		await new Promise(resolve => setTimeout(resolve, MIN_GAME_SWITCH_INTERVAL));
	}
	lastGameSwitchTime = Date.now();

	try {
		await initializeNewGame(mode);
	} catch (error) {
		console.error("Error starting new game:", error);
		alert(`${translations.gameStartError}`);
	}
}

async function initializeNewGame(mode) {
	window.isInGame = true;
	document.dispatchEvent(new Event('gameStarted'));
	window.currentGameMode = mode;
	window.updateExitButtonsVisibility();

	window.currentGameId = "game-" + Date.now();
	console.log("Generated game ID:", window.currentGameId);

	if (typeof window.openPongWebSocket === 'function') {
		window.openPongWebSocket(window.currentGameId, mode);
	} else {
		console.error('openPongWebSocket not found');
	}

	const exitGameBtn = document.querySelector('.exit-game');
	if (exitGameBtn) {
		exitGameBtn.classList.remove('disabled');
		exitGameBtn.disabled = false;
	}
}

function revertGameCardToDefault() {
	const canvas = document.getElementById('pong');
	const gameCard = document.querySelector('.game-card');
	const victoryScreen = document.getElementById('victory-screen');
	
	if (canvas) canvas.classList.add('hidden');
	if (gameCard) gameCard.classList.remove('hidden');
	if (victoryScreen) victoryScreen.classList.add('hidden');

	const leftScoreElement = document.querySelector('#current-player-score');
	const rightScoreElement = document.querySelector('#opponent-score');
	if (leftScoreElement) leftScoreElement.textContent = "0";
	if (rightScoreElement) rightScoreElement.textContent = "0";
}

function restoreDefaultScoreCard() {
	const leftPic = document.querySelector('.player-pic-container');
	if (leftPic) {
		leftPic.innerHTML = '';
		if (typeof currentUser !== 'undefined' && currentUser && currentUser.image_url) {
			const profileImage = document.createElement('img');
			profileImage.src = currentUser.image_url;
			profileImage.alt = 'Profile picture';
			leftPic.appendChild(profileImage);
		} else {
			const profileImage = document.createElement('img');
			profileImage.src = profilePicDefault;
			profileImage.alt = 'Default profile picture';
			leftPic.appendChild(profileImage);
		}
	}

	const rightPic = document.querySelector('.player-pic-container.opponent');
	if (rightPic) {
		rightPic.innerHTML = '';
	}
}

function updateExitButtonsVisibility() {
	const exitGameBtn = document.querySelector('.exit-game');
	const exitTournamentBtn = document.querySelector('.exit-tournament');
	
	if (!exitGameBtn || !exitTournamentBtn) {
	  return;
	}

	if (window.tournamentState && window.tournamentState.isActive) {
	  exitGameBtn.classList.add('hidden');
	  exitGameBtn.classList.add('disabled');
	  exitGameBtn.disabled = true;

	  exitTournamentBtn.classList.remove('hidden');
	  exitTournamentBtn.classList.remove('disabled');
	  exitTournamentBtn.disabled = false;
	} else if (window.isInGame) {
	  exitGameBtn.classList.remove('hidden');
	  exitGameBtn.classList.remove('disabled');
	  exitGameBtn.disabled = false;

	  exitTournamentBtn.classList.add('hidden');
	  exitTournamentBtn.classList.add('disabled');
	  exitTournamentBtn.disabled = true;
	} else {
	  exitGameBtn.classList.add('hidden');
	  exitGameBtn.classList.add('disabled');
	  exitGameBtn.disabled = true;
  
	  exitTournamentBtn.classList.add('hidden');
	  exitTournamentBtn.classList.add('disabled');
	  exitTournamentBtn.disabled = true;
	}
}

window.startNewPongGame = startNewPongGame;
window.revertGameCardToDefault = revertGameCardToDefault;
window.restoreDefaultScoreCard = restoreDefaultScoreCard;
window.updateExitButtonsVisibility = updateExitButtonsVisibility;
