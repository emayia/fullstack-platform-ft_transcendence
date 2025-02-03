async function showPlayerCard(player, isFromPlayersCard) {
	const isBlocked = await isUserBlocked(player.id);

	const userDetails = `
		<h2 class="card-title">${escapeHTML(translations.playerInfos)}</h2>
		<div class="player-profile">
			<img class="player-card-img" src="${escapeHTML(player.image_url || profilePicDefault)}" alt="Profile Picture">
			<p class="player-fullname">${escapeHTML(player.first_name)} ${escapeHTML(player.last_name)}</p>
			<p class="player-username">@${escapeHTML(player.username)}</p>
			<div class="player-actions">
				<button class="action-btn send-message-btn">${escapeHTML(translations.sendMessage)}</button>
				<button class="action-btn block-user-btn ${isBlocked ? 'unblock' : ''}">
					${isBlocked ? escapeHTML(translations.unblockUser) : escapeHTML(translations.blockUser)}
				</button>
			</div>
		</div>
	`;

	const adaptiveCard = document.querySelector('.adaptive-card');
	adaptiveCard.innerHTML = `
		<button class="back-btn">
			<img src="/static/assets/icons/back.svg" alt="Back icon">
		</button>
		<div class="adaptive-content">${userDetails}</div>
	`;
	adaptiveCard.classList.remove('hidden');

	setupBackButton(adaptiveCard, player, isFromPlayersCard);
	setupActionButtons(adaptiveCard, player, isBlocked);
}

function setupBackButton(adaptiveCard, player, isFromPlayersCard) {
	const backButton = adaptiveCard.querySelector('.back-btn');
	backButton.addEventListener('click', () => {
		adaptiveCard.classList.add('hidden');
		
		if (isFromPlayersCard) {
			adaptiveCard.innerHTML = `
				<button class="close-btn">
					<img src="/static/assets/icons/close.svg" alt="Close icon">
				</button>
				<div class="adaptive-content">${getPlayersCardContent()}</div>
			`;

			fetchActivePlayers().then(() => {
				adaptiveCard.classList.remove('hidden');

				const closeButton = adaptiveCard.querySelector('.close-btn');
				closeButton.addEventListener('click', () => {
					adaptiveCard.classList.add('hidden');
				});
				document.addEventListener(
					'playersFetched',
					(event) => {
						displayPlayers(event.detail);
					},
					{ once: true }
				);
			});
		} else {
			startChatWithPlayer(player.username, player.image_url, player.id)
		}
	});
}

function setupActionButtons(adaptiveCard, player, isBlocked) {
	const sendMessageBtn = adaptiveCard.querySelector('.send-message-btn');
	const blockUserBtn = adaptiveCard.querySelector('.block-user-btn');

	sendMessageBtn.addEventListener('click', () => {
		startChatWithPlayer(player.username, player.image_url, player.id);
	});

	let currentIsBlocked = isBlocked;

	blockUserBtn.addEventListener('click', async () => {
		try {
			if (currentIsBlocked) {
				await unblockUser(player.id);
				currentIsBlocked = false;
				blockUserBtn.textContent = `${translations.blockUser}`;
				blockUserBtn.classList.remove('unblock');
			} else {
				await blockUser(player.id);
				currentIsBlocked = true;
				blockUserBtn.textContent = `${translations.unblockUser}`;
				blockUserBtn.classList.add('unblock');
			}
		} catch (error) {
			console.error('Error updating block status:', error);
		}
	});
}


async function getOrCreateConversation(userId) {
	try {
		const response = await fetch(`/api/conversations/by-users/?user2_id=${userId}`, {
			method: 'GET',
			credentials: 'include',
		});
		if (response.status === 401) {
			redirectToWelcomePage();
		}
		else if (response.status === 404) {
			return createConversation(userId);
		}
		return await response.json();
	} catch (error) {
		console.error('Error fetching or creating conversation:', error);
		throw error;
	}
}

async function createConversation(userId) {
	try {
		const response = await secureFetch('/api/conversations/', {
			method: 'POST',
			body: JSON.stringify({ user2_id: userId }),
		});
		if (response.status === 401) {
			redirectToWelcomePage();
		}
		else if (!response.ok) {
			const error = await response.json();
			throw new Error(error.detail || "Error creating conversation.");
		}
		return await response.json();
	} catch (error) {
		console.error('Error creating conversation:', error);
		throw error;
	}
}

function startChatWithPlayer(username, imageUrl, userId) {
	const navButtons = document.querySelectorAll('.nav-btn');
	navButtons.forEach(nb => nb.classList.remove('active'));
	const messagesButton = Array.from(navButtons).find(b => b.classList.contains('messages'));
	if (messagesButton) {
		messagesButton.classList.add('active');
		localStorage.setItem('activeNav', 'messages');
	}
	getOrCreateConversation(userId)
		.then((conversationData) => {
			openConversation(conversationData.id, username, userId, imageUrl);
		})
		.catch(error => {
			console.error('Error in conversation flow:', error);
			displayChatWindow(username, userId, imageUrl, []);
		});
}

async function blockUser(userId) {
	try {
		const response = await secureFetch(`/api/users/block/${userId}/`, {
			method: 'POST',
		});
		if (response.status === 401) {
			redirectToWelcomePage();
		}
		else if (!response.ok) {
			const error = await response.json();
			throw new Error(error.detail || "Unknown error while blocking user.");
		}
	} catch (error) {
		console.error('Error while blocking user:', error);
		throw error;
	}
}

async function unblockUser(userId) {
	try {
		const response = await secureFetch(`/api/users/unblock/${userId}/`, {
			method: 'POST',
		});
		if (response.status === 401) {
			redirectToWelcomePage();
		}
		else if (!response.ok) {
			const error = await response.json();
			throw new Error(error.detail || "Unknown error while unblocking user.");
		}
	} catch (error) {
		console.error('Error while unblocking user:', error);
		throw error;
	}
}

async function isUserBlocked(userId) {
	try {
		const response = await fetch(`/api/users/is_blocked/${userId}/`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'include',
		});

		if (response.ok) {
			const data = await response.json();
			isBlocked = data.is_blocked;
		} else if (response.status === 401) {
			redirectToWelcomePage();
		} else {
			console.error('Failed to fetch blocking status:', response.statusText);
			return false;
		}
	} catch (error) {
		console.error('Error fetching blocking status:', error);
		return false;
	}
	return isBlocked;
}
