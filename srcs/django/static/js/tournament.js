document.addEventListener('DOMContentLoaded', async function () {

	window.tournamentState = {
		isActive: false,
		participants: [],
		currentChampionIdx: 0,
		nextChallengerIdx: 1,
		matchHistory: [],
		isMatchInProgress: false,
	};

	window.justFinishedTournament = false;

	function updateTournamentButtonState() {
		const startTournamentBtn = document.querySelector('#start-tournament-setup-btn');
		if (startTournamentBtn) {
			if (window.isInGame) {
				startTournamentBtn.classList.add('disabled');
				startTournamentBtn.disabled = true;
				startTournamentBtn.title = `${translations.tournamentStartError}`;
			} else {
				startTournamentBtn.classList.remove('disabled');
				startTournamentBtn.disabled = false;
				startTournamentBtn.title = `${translations.startTournament}`;
			}
		}
	}

	document.addEventListener('gameStarted', () => {
		updateTournamentButtonState();
		updateTournamentSetupButtons();
	});
	
	document.addEventListener('gameEnded', () => {
		updateTournamentButtonState();
		updateTournamentSetupButtons();
	});

	function updateTournamentSetupButtons() {
		const continueBtn = document.querySelector('#tournament-size-continue-btn');
		const startTournamentBtn = document.querySelector('#start-tournament-btn');
		const initialStartBtn = document.querySelector('#start-tournament-setup-btn');
		
		[continueBtn, startTournamentBtn, initialStartBtn].forEach(btn => {
			if (btn) {
				if (window.isInGame) {
					btn.classList.add('disabled');
					btn.disabled = true;
					btn.title = `${translations.tournamentStartError}`;
				} else {
					btn.classList.remove('disabled');
					btn.disabled = false;
					btn.title = btn.id === 'start-tournament-btn' ? 'Start tournament' : 
							   btn.id === 'start-tournament-setup-btn' ? 'Start a new tournament' : 
							   'Continue';
				}
			}
		});
	}

	const adaptiveCard = document.querySelector('.adaptive-card');
	if (!adaptiveCard) {
		console.warn('No .adaptive-card found in DOM; tournament card handling might fail.');
		return;
	}

	adaptiveCard.addEventListener('click', (e) => {
		const startBtn = e.target.closest('#start-tournament-setup-btn');
		if (startBtn && !startBtn.disabled) {
			showTournamentSetupForm();
		}
		const finishBtn = e.target.closest('#finish-tournament-btn');
		
		if (startBtn) {
			showTournamentSetupForm();
		}
		else if (finishBtn) {
			finishTournament();
		}
	});

	function showTournamentChampionOverlay(championAlias) {
		const victoryScreen = document.getElementById('victory-screen');
		if (!victoryScreen) return;
	
		const winnerPic = document.getElementById('winner-pic');
		const winnerMsg = document.getElementById('winner-msg');
		const backButton = document.getElementById('back-to-menu-btn');
	
		winnerMsg.textContent = `${translations.tournamentChampion} ${championAlias}`;
		winnerPic.src = profilePicDefault;
	
		backButton.replaceWith(backButton.cloneNode(true));
		const newBackButton = document.getElementById('back-to-menu-btn');
		newBackButton.textContent = `${translations.returnToMenu}`;
	
		newBackButton.addEventListener('click', () => {
			victoryScreen.classList.add('hidden');
			finishTournament();
		});
	
		victoryScreen.classList.remove('hidden');
	}

	function showTournamentSetupForm() {
		const content = `
			<h2 class="card-title">${escapeHTML(translations.tournamentSetup)}</h2>
			<div class="tournament-card-content-setup">
				<label for="tournament-size">${escapeHTML(translations.participantNumber)}</label>
				<input type="number" id="tournament-size" min="3" max="6" value="3" />
				<button id="tournament-size-continue-btn" 
					${window.isInGame ? 'disabled class="disabled"' : ''} 
					title="${window.isInGame ? translations.tournamentStartError : translations.Continue}">
					${escapeHTML(translations.Continue)}
				</button>
			</div>
		`;
		adaptiveCard.innerHTML = `
			<button class="close-btn"><img src="${closeIcon}" alt="Close icon"></button>
			<div class="adaptive-content">
				${content}
			</div>
		`;
	}

	adaptiveCard.addEventListener('click', (e) => {
		const sizeContinueBtn = e.target.closest('#tournament-size-continue-btn');
		if (!sizeContinueBtn) return;

		if (window.isInGame) {
			alert(`${translations.tournamentSetupError}`);
			return;
		}

		const inputSize = document.getElementById('tournament-size');
		let size = parseInt(inputSize.value, 10);
		if (isNaN(size) || size < 3 || size > 6) {
			alert(`${translations.invalidParticipantNumber}`);
			return;
		}
		showAliasInputForm(size);
	});

	function showAliasInputForm(size) {
		let aliasInputs = '';
		for (let i = 1; i <= size; i++) {
			aliasInputs += `
				<div class="alias-input-row">
					<label>${escapeHTML(translations.Player)} ${escapeHTML(i)}:</label>
					<input type="text" class="alias-input" id="alias-${i}" maxlength="10"
						   placeholder="${escapeHTML(translations.upTo10Letters)}" />
				</div>
			`;
		}
	
		const content = `
			<h2 class="card-title">${escapeHTML(translations.setAliases)}</h2>
			<div class="alias-section">
				<p>${escapeHTML(translations.enterAliases)}</p>
				${aliasInputs}
				<button id="start-tournament-btn" class="primary-btn"
					${window.isInGame ? 'disabled class="disabled"' : ''} 
					title="${window.isInGame ? translations.tournamentStartError : translations.startTournament}">
					${escapeHTML(translations.startTournament)}
				</button>
			</div>
		`;
	
		adaptiveCard.innerHTML = `
			<button class="close-btn"><img src="${closeIcon}" alt="Close icon"></button>
			<div class="adaptive-content">
				${content}
			</div>
		`;
	}

	adaptiveCard.addEventListener('click', async (e) => {
		const btn = e.target.closest('#start-tournament-btn');
		if (!btn) return;
	
		if (window.isInGame) {
			alert(`${translations.tournamentStartError}`);
			return;
		}

		const aliasInputs = Array.from(document.querySelectorAll('.alias-input'));
		const participants = [];
		const usedAliases = new Set();
	
		for (let i = 0; i < aliasInputs.length; i++) {
			let val = aliasInputs[i].value.trim();
			const errorMessage = translations.invalidAlias.replace("#{i}", i + 1);
			if (!/^[\p{L}]+$/u.test(val)) {
				alert(errorMessage);
				return;
			}

			if (usedAliases.has(val.toLowerCase())) {
				const duplicateMessage = translations.duplicateAlias.replace("#{alias}", val);
				alert(duplicateMessage);
				return;
			}

			usedAliases.add(val.toLowerCase());
			participants.push({ alias: val, wins: 0 });
		}

		setTimeout(() => {
			window.tournamentState = {
				isActive: true,
				participants: participants,
				currentChampionIdx: 0,
				nextChallengerIdx: 1,
				matchHistory: [],
				isMatchInProgress: false
			};
	
			refreshTournamentCard();
			startTournamentMatch();
		}, 100);
	});

	function findNextChallenger(championIdx, participants) {
		const totalParticipants = participants.length;
		const recentMatches = window.tournamentState.matchHistory.slice(-totalParticipants);

		let validChallengers = [];
		for (let i = 0; i < totalParticipants; i++) {
			if (i === championIdx) continue;
			
			let hasRecentlyPlayed = false;
			for (const match of recentMatches) {
				if (i === match.player1 || i === match.player2) {
					hasRecentlyPlayed = true;
					break;
				}
			}
			
			if (!hasRecentlyPlayed) {
				validChallengers.push(i);
			}
		}

		if (validChallengers.length > 0) {
			return validChallengers[0];
		}

		let lastPlayedAgainstChampion = new Array(totalParticipants).fill(-1);
		window.tournamentState.matchHistory.forEach((match, index) => {
			if (match.player1 === championIdx) {
				lastPlayedAgainstChampion[match.player2] = index;
			} else if (match.player2 === championIdx) {
				lastPlayedAgainstChampion[match.player1] = index;
			}
		});

		let nextChallenger = -1;
		let oldestMatch = Infinity;
		for (let i = 0; i < totalParticipants; i++) {
			if (i !== championIdx && lastPlayedAgainstChampion[i] < oldestMatch) {
				oldestMatch = lastPlayedAgainstChampion[i];
				nextChallenger = i;
			}
		}

		return nextChallenger;
	}

	function refreshTournamentCard() {
		const newContent = getTournamentCardContent();
		adaptiveCard.innerHTML = `
			<button class="close-btn"><img src="${closeIcon}" alt="Close icon"></button>
			<div class="adaptive-content">
				${newContent}
			</div>
		`;
	}

	async function startTournamentMatch() {
		if (!window.tournamentState.isActive) return;
		if (window.isInGame) {
			console.warn('A game is already in progress. Please wait.');
			return;
		}
		if (window.tournamentState.isMatchInProgress) {
			console.warn('Tournament match is already in progress...');
			return;
		}
		await initializeTournamentMatch();
	}

	async function initializeTournamentMatch() {
		const championPlayer = window.tournamentState.participants[window.tournamentState.currentChampionIdx];
		const challengerPlayer = window.tournamentState.participants[window.tournamentState.nextChallengerIdx];

		const leftLabel = document.getElementById('player-label-left');
		const rightLabel = document.getElementById('player-label-right');
		const leftPicContainer = document.querySelector('.player-pic-container');
		const rightPicContainer = document.querySelector('.player-pic-container.opponent');
	
		if (leftPicContainer) leftPicContainer.style.display = 'none';
		if (rightPicContainer) rightPicContainer.style.display = 'none';
		if (leftLabel) leftLabel.textContent = championPlayer.alias;
		if (rightLabel) rightLabel.textContent = challengerPlayer.alias;
	
		window.isInGame = true;
		window.tournamentState.isMatchInProgress = true;
	
		if (window.updateExitButtonsVisibility) {
			window.updateExitButtonsVisibility();
		}

		if (window.reset3DSceneForNewMatch) {
			window.reset3DSceneForNewMatch();
		}
	
		await startNewPongGame('local');
	}

	const originalShowVictoryScreen = window.showVictoryScreen;
	window.showVictoryScreen = function(winner, mode) {
		if (window.tournamentState.isActive && mode === 'local') {
			const championIdx = window.tournamentState.currentChampionIdx;
			const challengerIdx = window.tournamentState.nextChallengerIdx;
			const potentialWinnerIdx = winner === 'Left Player' ? championIdx : challengerIdx;
			const wins = window.tournamentState.participants[potentialWinnerIdx].wins;

			if (wins === 4) {
				handleTournamentMatchEnd(winner);
				return;
			}
		}

		originalShowVictoryScreen(winner, mode);
		
		if (window.tournamentState.isActive && mode === 'local') {
			handleTournamentMatchEnd(winner);
		}
	};

	async function handleTournamentMatchEnd(winner) {
		const championIdx = window.tournamentState.currentChampionIdx;
		const challengerIdx = window.tournamentState.nextChallengerIdx;
		const isChampionChange = winner !== 'Left Player';

		window.tournamentState.matchHistory.push({
			player1: championIdx,
			player2: challengerIdx,
			winner: winner === 'Left Player' ? championIdx : challengerIdx
		});
		
		if (winner === 'Left Player') {
			window.tournamentState.participants[championIdx].wins++;
		} else {
			window.tournamentState.participants[challengerIdx].wins++;
			window.tournamentState.currentChampionIdx = challengerIdx;
		}
		
		window.tournamentState.isMatchInProgress = false;
		window.isInGame = false;

		const actualChampion = window.tournamentState.participants[window.tournamentState.currentChampionIdx];
		if (actualChampion.wins >= 5) {
			setTimeout(() => {
				showTournamentChampionOverlay(actualChampion.alias);
			}, 300);
			return;
		}

		const nextChallenger = findNextChallenger(
			window.tournamentState.currentChampionIdx,
			window.tournamentState.participants
		);
	
		if (nextChallenger === -1) {
			alert(`${translations.defaultWinnerMessage}`);
			finishTournament();
			return;
		}

		if (isChampionChange) {
			await new Promise(resolve => setTimeout(resolve, 300));
		}
	
		window.tournamentState.nextChallengerIdx = nextChallenger;

		const championAlias = actualChampion.alias;
		const nextAlias = window.tournamentState.participants[nextChallenger].alias;
		
		const victoryScreen = document.getElementById('victory-screen');
		if (victoryScreen) {
			const winnerMsg = document.getElementById('winner-msg');
			winnerMsg.textContent = `${translations.nextGame} ${championAlias} ${translations.vs} ${nextAlias}`;
			
			const backButton = document.getElementById('back-to-menu-btn');
			if (backButton) {
				backButton.textContent = `${translations.startNewGame}`;
				backButton.replaceWith(backButton.cloneNode(true));
			}

			const newBackButton = document.getElementById('back-to-menu-btn');
			newBackButton.addEventListener('click', async () => {
				victoryScreen.classList.add('hidden');
				
				const leftScore = document.querySelector('#current-player-score');
				const rightScore = document.querySelector('#opponent-score');
				if (leftScore) leftScore.textContent = "0";
				if (rightScore) rightScore.textContent = "0";

				startTournamentMatch();
			});
		}
	
		setTimeout(refreshTournamentCard, 300);
	}

	async function finishTournament() {
		console.log("[finishTournament] Starting tournament cleanup...");

		if (window.currentGameId) {
			if (window.exitCurrentGame) {
				window.exitCurrentGame();
			}
		}
		
		const gameCard = document.querySelector('.game-card');
		if (gameCard) {
			gameCard.classList.remove('hidden');
		}
	
		if (window.revertGameCardToDefault) {
			window.revertGameCardToDefault();
		}
		if (window.restoreDefaultScoreCard) {
			window.restoreDefaultScoreCard();
		}
	
		window.tournamentState = {
			isActive: false,
			participants: [],
			currentChampionIdx: 0,
			nextChallengerIdx: 1,
			matchHistory: [],
			isMatchInProgress: false
		};
	
		window.isInGame = false;
		window.currentGameMode = null;
		window.currentGameId = null;
	
		if (window.pongSocket) {
			window.pongSocket.close();
			window.pongSocket = null;
		}
	
		if (window.updateExitButtonsVisibility) {
			window.updateExitButtonsVisibility();
		}

		window.justFinishedTournament = true;
		refreshTournamentCard();
	}

	window.finishTournament = finishTournament;
});
