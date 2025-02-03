function scaleLayout() {
	const baseWidth = 1920;
	const baseHeight = 1080;
	
	const container = document.querySelector('.base-container');
	const windowWidth = document.querySelector('.scaling-wrapper').clientWidth;
	const windowHeight = document.querySelector('.scaling-wrapper').clientHeight;
	
	const scale = Math.min(windowWidth / baseWidth, windowHeight / baseHeight);
	container.style.transform = `scale(${scale})`;
}

let currentUser = null;
let isInChatWindow = false;

function getTournamentCardContent() {
	if (!window.tournamentState || !window.tournamentState.isActive) {
		return `
		<h2 class="card-title">${escapeHTML(translations.Tournament)}</h2>
		<div class="tournament-card-content-begin">
			<p>${escapeHTML(translations.noOnGoingTournament)}</p>
			<button id="start-tournament-setup-btn" 
					${window.isInGame ? 'disabled class="disabled"' : ''} 
					title="${window.isInGame ? translations.startTournamentError : translations.startTournament}">
					${escapeHTML(translations.startNewTournament)}
			</button>
		</div>
		`;
	} 
	else {
		const participants = window.tournamentState.participants;
		const tableRows = participants.map(p => {
			return `
				<tr>
					<td>${p.alias}</td>
					<td>${p.wins}</td>
				</tr>
			`;
		}).join('');

		return `
		<h2 class="card-title">${escapeHTML(translations.Tournament)}</h2>
		<div class="tournament-card-content-ongoing">
			<p>${escapeHTML(translations.noOnGoingTournament)}</p>
			<table class="tournament-participants-table">
				<thead>
					<tr>
						<th>${escapeHTML(translations.Alias)}</th>
						<th>${escapeHTML(translations.Wins)}</th>
					</tr>
				</thead>
				<tbody>
					${tableRows}
				</tbody>
			</table>
			<p>${escapeHTML(translations.isChampion)}</p>
		</div>
		`;
	}
}


document.addEventListener('userLoaded', (event) => {
	currentUser = event.detail;
	if (currentUser && currentUser.image_url) {
		const playerPicContainer = document.querySelector('.player-pic-container');
		if (playerPicContainer) {
			const profileImage = document.createElement('img');
			profileImage.src = currentUser.image_url;
			profileImage.alt = 'Profile picture';
			playerPicContainer.appendChild(profileImage);
		}
	}

	const welcomeSection = document.getElementById('welcome-section');
	const mainContent = document.getElementById('main-content');
	if (welcomeSection && mainContent) {
		welcomeSection.classList.add('hidden');
		mainContent.classList.remove('hidden');
	}
});

document.addEventListener('userLoggedOut', async () => {
	const playerPicContainers = document.querySelectorAll('.player-pic-container img');
	playerPicContainers.forEach(img => img.remove());

	if (window.rendererHasBeenCreated && typeof window.dispose3D === 'function') {
		await window.dispose3D();
		window.rendererHasBeenCreated = false;
	}
});

document.addEventListener('DOMContentLoaded', () => {
	scaleLayout();
	window.addEventListener('resize', scaleLayout);

	const adaptiveCard = document.querySelector('.adaptive-card');
	const navButtons = document.querySelectorAll('.nav-btn');
	const container = document.querySelector('.base-container');
	const exitGameBtn = document.querySelector('.exit-game');
	const gameCard = document.querySelector('.game-card');
	const gameModeOptions = document.querySelectorAll('.game-mode-option');
	const pongContainer = document.getElementById('pong-container');
	const canvas2D = document.getElementById('pong');

	window.initHashRouter();

	if (pongContainer) {
		pongContainer.classList.add('hidden');
	}

	if (gameModeOptions) {
		gameModeOptions.forEach(opt => {
			opt.addEventListener('click', async () => {
				const mode = opt.getAttribute('data-mode');
				console.log('Game mode selected:', mode);
				
				await new Promise(resolve => setTimeout(resolve, 100));
				
				if (gameCard) {
					gameCard.classList.add('hidden');
				}
				
				if (pongContainer) {
					pongContainer.classList.remove('hidden');
				}
				
				if (canvas2D) {
					canvas2D.style.display = 'none';
				}

				if (window.startNewPongGame) {
					window.startNewPongGame(mode);
				}
			});
		});
	}

	if (exitGameBtn) {
		exitGameBtn.addEventListener('click', async () => {
			if (!window.isInGame) return;

			if (window.exitCurrentGame) {
				window.exitCurrentGame();
			}
			
			window.isInGame = false;
			exitGameBtn.classList.add('disabled');
			exitGameBtn.disabled = true;

			if (window.revertGameCardToDefault) {
				window.revertGameCardToDefault();
			}
			if (window.restoreDefaultScoreCard) {
				window.restoreDefaultScoreCard();
			}
			if (window.updateExitButtonsVisibility) {
				window.updateExitButtonsVisibility();
			}

			await new Promise(resolve => setTimeout(resolve, 100));

			if (pongContainer) {
				pongContainer.classList.add('hidden');
			}
			if (canvas2D) {
				canvas2D.style.display = 'block';
			}
			if (gameCard) {
				gameCard.classList.remove('hidden');
			}
		});
	}

	const exitTournamentBtn = document.querySelector('.exit-tournament');
	if (exitTournamentBtn) {
		exitTournamentBtn.addEventListener('click', () => {
			console.log("[exitTournamentBtn] Clicked! Now calling finishTournament()...");
			if (typeof finishTournament === 'function') {
				finishTournament();
			} else {
				console.warn("finishTournament() not found!");
			}
		});
	}

	const backToMenuBtn = document.getElementById('back-to-menu-btn');
	if (backToMenuBtn) {
		backToMenuBtn.addEventListener('click', async () => {
			if (window.exitCurrentGame) {
				window.exitCurrentGame();
			}
		
			const victoryScreen = document.getElementById('victory-screen');
			if (victoryScreen) {
				victoryScreen.classList.add('hidden');
			}

			if (window.revertGameCardToDefault) {
				window.revertGameCardToDefault();
			}
			if (window.restoreDefaultScoreCard) {
				window.restoreDefaultScoreCard();
			}
			
			window.isInGame = false;
			if (window.updateExitButtonsVisibility) {
				window.updateExitButtonsVisibility();
			}

			await new Promise(resolve => setTimeout(resolve, 100));

			if (pongContainer) {
				pongContainer.classList.add('hidden');
			}
			if (canvas2D) {
				canvas2D.style.display = 'block';
			}
			if (gameCard) {
				gameCard.classList.remove('hidden');
			}
		});
	}

	function showAdaptiveCard(content) {
		adaptiveCard.innerHTML = `
			<button class="close-btn"><img src="${closeIcon}" alt="Close icon"></button>
			<div class="adaptive-content">
				${content}
			</div>
		`;
		adaptiveCard.classList.remove('hidden');
		container.classList.remove('centered-layout');
	}

	function hideAdaptiveCard() {
		adaptiveCard.classList.add('hidden');
		container.classList.add('centered-layout');
	}
	window.hideAdaptiveCard = hideAdaptiveCard;

	function getCardContent(section) {
		if (section === 'profile') {
			return getProfileCardContent();
		} else if (section === 'players') {
			return getPlayersCardContent();
		} else if (section === 'languages') {
			return getLanguagesCardContent();
		} else if (section === 'messages') {
			return getMessagesCardContent();
		} else if (section === 'tournament') {
			return getTournamentCardContent();
		} else if (section === 'themes') {
			return getThemesCardContent();
		}
		return '';
	}

	function openSection(section) {
		navButtons.forEach(nb => nb.classList.remove('active'));
		const btnToActivate = Array.from(navButtons).find(b => b.classList.contains(section));
		if (btnToActivate) {
			btnToActivate.classList.add('active');
		}

		const content = getCardContent(section);
		if (content) {
			showAdaptiveCard(content);
			localStorage.setItem('activeNav', section);

			if (section === 'themes') {
				handleThemeSelection();
			}
			else if (section === 'languages') {
				handleLanguageSelection();
			}

			const logoutBtn = adaptiveCard.querySelector('#logout-btn');
			if (logoutBtn) {
				logoutBtn.addEventListener('click', () => {
					const logoutEvent = new CustomEvent('logoutRequest');
					document.dispatchEvent(logoutEvent);
				});
			}
		} else {
			hideAdaptiveCard();
			localStorage.removeItem('activeNav');
		}

		if (window.hashRouter) {
			window.hashRouter.updateHash(section);
		}
	}

	navButtons.forEach(btn => {
		btn.addEventListener('click', () => {
			const sections = ['profile','players','languages','messages','tournament','themes'];
			const activeNav = sections.find(c => btn.classList.contains(c)) || '';
			if (activeNav) {
				openSection(activeNav);
			} else {
				hideAdaptiveCard();
				localStorage.removeItem('activeNav');
			}
		});
	});

	adaptiveCard.addEventListener('click', (e) => {
		if (e.target.closest('.close-btn')) {
			hideAdaptiveCard();
			navButtons.forEach(nb => nb.classList.remove('active'));
			localStorage.removeItem('activeNav');
		}
	});

	const savedActiveNav = localStorage.getItem('activeNav');
	if (savedActiveNav) {
		openSection(savedActiveNav);
	}

	setTimeout(() => {
		document.documentElement.classList.remove('no-transitions');
		document.documentElement.classList.add('transitions-enabled');
	}, 50);
});
