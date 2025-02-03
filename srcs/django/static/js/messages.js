const usersCache = new Map();

function getMessagesCardContent() {
	fetchConversations();
	return `<h2 class="card-title">${escapeHTML(translations.Messages)}</h2><div id="conversation-list"></div>`;
}

async function fetchConversations() {
	try {
		const response = await fetch('/api/conversations/', {
			method: 'GET',
			credentials: 'include',
		});
	
		if (response.status === 401) {
			redirectToWelcomePage();
		}
		else if (!response.ok) {
			throw new Error('Error while retrieving conversations');
		}
	
		const data = await response.json();
		const conversationList = document.getElementById('conversation-list');
		if (!conversationList) return;
	
		conversationList.innerHTML = '';
	
		if (data.length === 0) {
			conversationList.innerHTML = `<p id="empty-chat-box">${escapeHTML(translations.emptyChatBox)}</p>`;
			return;
		}
	
		data.forEach(conversation => {
			usersCache.set(conversation.user2_id, {
				user2_first_name: conversation.user2_first_name,
				user2_last_name: conversation.user2_last_name,
			});

			const lastMessage = conversation.last_message ? `${conversation.last_message.content}` : `${translations.noMessagesYet}`;
			const { user2_username, user2_id, user2_profile_picture: profile_pic } = conversation;

			const listItem = createConversationListItem(profile_pic, lastMessage, user2_username, user2_id, conversation.id);
			conversationList.appendChild(listItem);
		});
	} catch (error) {
		console.error(error.message);
	}
}

function createConversationListItem(profilePic, lastMessage, username, userId, conversationId) {
	const unreadConversations = getUnreadConversationsFromCache();
	const isUnread = unreadConversations.includes(conversationId);

	const truncatedMessage = lastMessage.length > 30 
		? lastMessage.substring(0, 30) + '...' 
		: lastMessage;
	
	const listItem = document.createElement('li');
	listItem.setAttribute('data-conversation-id', conversationId);
	
	if (isUnread) {
		listItem.classList.add('unread');
	}

	listItem.innerHTML = `
		<img src="${profilePic || profilePicDefault}" alt="User Profile Picture" class="profile-pic">
		<div class="conversation-text">
			<p class="conversation-username">@${username}</p>
			<p class="conversation-preview">${truncatedMessage}</p>
		</div>
		<button onclick="openConversation(${conversationId}, '${username}', ${userId}, '${profilePic || profilePicDefault}')">Open Chat</button>
	`;

	listItem.addEventListener('click', () => {
		openConversation(conversationId, username, userId, profilePic || profilePicDefault);
	});

	return listItem;
}

async function openConversation(conversationId, username, user_id, profile_pic) {
	try {
		const response = await fetch(`/api/conversations/${conversationId}/messages`, {
			method: 'GET',
			credentials: 'include',
		});
		if (response.status === 401) {
			redirectToWelcomePage();
		}
		else if (!response.ok) {
			throw new Error('Failed to fetch messages.');
		} 
		const conversationData = await response.json();
		displayChatWindow(username, user_id, profile_pic, conversationData);
		isInChatWindow = true;
		if (currentUser) {
			initializeChat(conversationId, username, currentUser.id, user_id);
		}
	} catch (error) {
		console.error('Error in openConversation:', error);
	}
}

function displayChatWindow(username, user_id, imageUrl, messages = []) {
	const adaptiveCard = document.querySelector('.adaptive-card');
	if (!adaptiveCard) return console.error('Adaptive card not found');

	const chatContent = createChatContent(username, user_id, imageUrl, messages);

	adaptiveCard.innerHTML = `
	<button class="back-btn"><img src="/static/assets/icons/back.svg" alt="Back icon"></button>
	<div class="adaptive-content">${chatContent}</div>
	`;

	const chatMessages = document.getElementById("chat-messages");
	chatMessages.scrollTop = chatMessages.scrollHeight;
	
	adaptiveCard.classList.remove('hidden');
	setupChatBackButton(adaptiveCard);
	setupProfileImageClick(user_id, username, imageUrl);
}

function handleInputChange(event) {
	const input = event.target;
	const submitButton = input.form.querySelector('button[type="submit"]');
	submitButton.disabled = !input.value.trim();
}

function createChatContent(username, user_id, imageUrl, messages) {
	return `
		<div class="chat-section" id="chat-section">
			<div class="chat-header">
				<div class="user-info">
					<img class="chat-player-img" src="${escapeHTML(imageUrl || profilePicDefault)}" alt="Profile Picture">
					<p class="chat-player-username">@${escapeHTML(username)}</p>
				</div>
			</div>
			<div id="chat-messages" class="chat-messages">
				${messages.map(message =>
					`<p class="message ${escapeHTML(message.sender === username ? 'received' : 'sent')}">${escapeHTML(message.content)}</p>`
				).join('')}
			</div>
			<form id="chat-form" class="chat-form">
				<input type="text" id="chat-input" placeholder="${escapeHTML(translations.typeMessage)}" maxlength="140" oninput="handleInputChange(event)">
				<button type="submit" disabled>${escapeHTML(translations.Send)}</button>
			</form>
		</div>
	`;
}

function setupChatBackButton(adaptiveCard) {
	const backButton = adaptiveCard.querySelector('.back-btn');
	backButton.addEventListener('click', () => {
		adaptiveCard.classList.add('hidden');
		isInChatWindow = false;
		adaptiveCard.innerHTML = `
			<button class="close-btn">
				<img src="/static/assets/icons/close.svg" alt="Close icon">
			</button>
			<div class="adaptive-content">${getMessagesCardContent()}</div>
		`;

		fetchConversations().then(() => {
			adaptiveCard.classList.remove('hidden');
			const closeButton = adaptiveCard.querySelector('.close-btn');
			closeButton.addEventListener('click', () => {
				adaptiveCard.classList.add('hidden');
			});
		});
	});
}

function setupProfileImageClick(user_id, username, imageUrl) {
	const profileImage = document.querySelector('.chat-player-img');
	profileImage.addEventListener('click', () => {
		const userData = usersCache.get(user_id);
		const { user2_first_name = '', user2_last_name = '' } = userData || {};
		const completeUserData = {
			id: user_id,
			username,
			first_name: user2_first_name,
			last_name: user2_last_name,
			image_url: imageUrl || null,
			is_active: true,
		};
		showPlayerCard(completeUserData, false);
	});
}

function getUnreadConversationsFromCache() {
	const unreadConversations = localStorage.getItem('unreadConversations');
	return unreadConversations ? JSON.parse(unreadConversations) : [];
}

async function markConversationAsReadInCache(conversationId) {
	try {
		const unreadConversations = getUnreadConversationsFromCache();
		const updatedUnreadConversations = unreadConversations.filter(id => id !== conversationId);
		localStorage.setItem('unreadConversations', JSON.stringify(updatedUnreadConversations));
		const conversationItem = document.querySelector(`li[data-conversation-id="${conversationId}"]`);
		if (conversationItem) {
			conversationItem.classList.remove('unread');
		}
	} catch (error) {
		console.error('Error while updating read conversations status:', error);
	}
}

function updateNotificationBadge() {
	const messagesNav = document.querySelector('.nav-btn.messages');
	if (!messagesNav) return;

	let badge = messagesNav.querySelector('.notification-badge');
	if (!badge) {
		badge = document.createElement('div');
		badge.className = 'notification-badge';
		messagesNav.appendChild(badge);
	}

	getUnreadMessagesInfo().then(({ unread_count }) => {
		if (unread_count > 0) {
			badge.textContent = unread_count > 99 ? '99+' : unread_count;
			badge.classList.add('visible');
		} else {
			badge.classList.remove('visible');
		}
	});
}
