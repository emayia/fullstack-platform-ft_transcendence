let playersSocket = null;
let shouldReconnect = true;

function getPlayersCardContent() {
	const playersHTML = fetchActivePlayers();
	return `<h2 class="card-title">${translations.Players}</h2><div id="active-players-list"></div>`;
}

function displayPlayers(players) {
	const playersList = document.getElementById('active-players-list');
	if (!playersList) {
		return;
	}
	playersList.innerHTML = '';

	const filteredPlayers = players.filter(player => player.is_active && player.username !== currentUser.username);
	
	if (filteredPlayers.length === 0) {
		playersList.innerHTML = `<p id="no-available-player">${escapeHTML(translations.noPlayersAvailable)}</p>`;
	} else {
		const playerItems = filteredPlayers.map(player => `
			<li class="online-player-item">
				<img class="online-player-img" src="${escapeHTML(player.image_url || profilePicDefault)}" alt="Profile Picture">
				<p class="online-player-username">@${escapeHTML(player.username)}</p>
			</li>
		`).join('');
		
		playersList.innerHTML = `<ul class="online-players-list">${playerItems}</ul>`;

		const playerListItems = document.querySelectorAll('.online-player-item');
		playerListItems.forEach((item, index) => {
			item.addEventListener('click', () => {
				const player = filteredPlayers[index];
				showPlayerCard(player, true);
			});
		});
	}
}

async function fetchActivePlayers() {
	try {
		const response = await fetch('/api/active-players/', {
			method: 'GET',
			credentials: 'include',
		});

		if (response.ok) {
			const players = await response.json();
			const event = new CustomEvent('playersFetched', { 
				detail: players 
			});
			document.dispatchEvent(event);
		} else if (response.status === 401) {
			redirectToWelcomePage();
		} else {
			console.error('Failed to fetch active players:', response.statusText);
			return [];
		}
	} catch (error) {
		console.error('Error fetching active players:', error);
		return [];
	}
}

function initWebSocket() {
	if (!shouldReconnect) return;

	const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
	const url = `${protocol}${window.location.host}/ws/players/`;
	playersSocket = new WebSocket(url);

	playersSocket.addEventListener('message', function(event) {
		const data = JSON.parse(event.data);

		const updateEvent = new CustomEvent('playersUpdated', { 
			detail: data.players 
		});
		document.dispatchEvent(updateEvent);
	});

	playersSocket.addEventListener('open', () => console.log('Players WebSocket connection established'));
	playersSocket.addEventListener('close', () => {
		console.log('Players WebSocket connection closed');
		playersSocket = null;
		if (shouldReconnect) {
			setTimeout(() => {
				if (!playersSocket) initWebSocket();
			}, 3000);
		}
	});
	playersSocket.addEventListener('error', (error) => console.error('Players WebSocket error:', error));	
}

function initPlayerEvents() {
	document.addEventListener('playersFetched', function(event) {
		displayPlayers(event.detail);
	});

	document.addEventListener('playersUpdated', function(event) {
		displayPlayers(event.detail);
	});
}

function initPlayersList() {
	initPlayerEvents();
	fetchActivePlayers();
	initWebSocket();
}

function closePlayersWebsocket() {
	shouldReconnect = false;
	if (playersSocket) {
		playersSocket.close();
		playersSocket= null;
		console.log("Players WebSocket connection closed successfully.");
	}
}
