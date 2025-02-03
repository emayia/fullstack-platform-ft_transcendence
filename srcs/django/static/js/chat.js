let chatSocket = null;

function initializeChat(conversationId, username, currentUserId, userId) {
	const chatForm = document.getElementById("chat-form");
	const chatInput = document.getElementById("chat-input");
	const chatMessages = document.getElementById("chat-messages");

	if (!chatForm || !chatInput || !chatMessages) {
		console.error("Missing chat elements!");
		return;
	}

	markMessagesAsReadInDatabase(conversationId);
	markConversationAsReadInCache(conversationId);

	setupWebSocket(currentUserId, userId, chatMessages, username);
	setupChatForm(chatForm, chatInput, conversationId, username);
}

function setupWebSocket(currentUserId, userId, chatMessages, username) {
	const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
	const websocketUrl = `${protocol}${window.location.host}/ws/chat/${currentUserId}/${userId}/`;
	chatSocket = new WebSocket(websocketUrl);

	chatSocket.onopen = () => {
		console.log("Chat WebSocket connection established");
		if (notificationIntervalId) {
			clearInterval(notificationIntervalId);
			notificationIntervalId = null;
		}
	};
	chatSocket.onmessage = (event) => handleWebSocketMessage(event, chatMessages, username);
	chatSocket.onerror = (error) => console.error("Chat WebSocket error:", error);
	chatSocket.onclose = (event) => {
		setTimeout(() => {
			console.log("Reconnecting WebSocket...");
			setupWebSocket(currentUserId, userId, chatMessages, username);
		}, 5000);
	};
	chatSocket.send = function (data) {
		if (chatSocket.readyState === WebSocket.OPEN) {
			WebSocket.prototype.send.call(chatSocket, data);
		} else {
			console.error("Attempt to send on a closed WebSocket connection");
		}
	};
}

function handleWebSocketMessage(event, chatMessages, username) {
	try {
		const data = JSON.parse(event.data);

		if (!data.message || !data.sender) {
			console.error("Invalid message format:", data);
			return;
		}
		appendMessageToChat(chatMessages, data.message, data.sender, username);

		if (!isInChatWindow) {
			updateNotificationBadge();
			updateMessagesCard(data);
		}
	} catch (error) {
		console.error("Error parsing WebSocket message:", error);
	}
}

function appendMessageToChat(chatMessages, message, sender, username) {
	const messageElement = document.createElement("p");
	messageElement.className = sender === username ? "message sent" : "message received";
	messageElement.textContent = message;
	chatMessages.appendChild(messageElement);
	chatMessages.scrollTop = chatMessages.scrollHeight;
}

function setupChatForm(chatForm, chatInput, conversationId, username) {
	chatForm.addEventListener("submit", async (event) => {
		event.preventDefault();
		const content = chatInput.value.trim();
		if (!content) return;

		try {
			const response = await secureFetch("/api/messages/", {
				method: "POST",
				body: JSON.stringify({ conversation_id: conversationId, content }),
			});
			if (!response.ok) {
				if (response.status === 403) {
					const errorData = await response.json();
					if (errorData.blocked_status === 1) {
						alert(`${translations.blockingUserAlert}`);
					} else if (errorData.blocked_status === 2) {
						alert(`${translations.blockedUserAlert}`);
					}
					return;
				} else if (response.status === 401) {
					redirectToWelcomePage();
					return;
				}
				console.error('Failed to send message.');
				return;
			}

			const newMessage = await response.json();
			
			chatSocket.send(JSON.stringify({
				type: "new_message",
				conversation_id: conversationId,
				message: newMessage.message.content,
				sender: username,
			}));

			chatInput.value = "";
		} catch (error) {
			console.error("Error sending message:", error);
		}
	});
}

function updateMessagesCard(data) {
	const conversationList = document.getElementById('conversation-list');
	if (!conversationList) {
		return;
	}

	fetchConversations();
	
	const conversationItem = Array.from(conversationList.querySelectorAll("li"))
		.find(item => item.getAttribute("data-conversation-id") == data.conversation_id);
	if (conversationItem) {
		const lastMessageElement = conversationItem.querySelector(".last-message");
		if (lastMessageElement) lastMessageElement.textContent = data.message;
	}
}

async function markMessagesAsReadInDatabase(conversationId) {
	try {
		const response = await secureFetch(`/api/messages/${conversationId}/mark-as-read/`, {
			method: 'POST',
		});
		if (response.status === 401) {
			redirectToWelcomePage();
		}
		else if (!response.ok) {
			const errorData = await response.json();
			console.error('Failed to mark messages as read:', errorData.error);
		}
		updateNotificationBadge();
	} catch (error) {
		console.error('Error marking messages as read:', error);
	}
}

async function getUnreadMessagesInfo() {
	try {
		const response = await fetch('/api/messages/unread-messages/', {
			method: 'GET',
			credentials: 'include',
		});
		if (response.status === 401) {
			redirectToWelcomePage();
			return { unread_count: 0, unread_conversations: [] };
		}
		else if (!response.ok) {
			const errorData = await response.json();
			console.error('Failed to retrieve unread messages info:', errorData.error);
			return { unread_count: 0, unread_conversations: [] };
		}

		const data = await response.json();
		localStorage.setItem('unreadConversations', JSON.stringify(data.unread_conversations));
		return {
			unread_count: data.unread_count,
			unread_conversations: data.unread_conversations,
		};
	} catch (error) {
		console.error('Error fetching unread messages count:', error);
		return 0;
	}
}

function closeChatWebsocket() {
	if (chatSocket) {
		chatSocket.close();
		chatSocket= null;
		console.log("Chat WebSocket connection closed successfully.");
	}
}
