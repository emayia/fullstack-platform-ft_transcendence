let notificationIntervalId = null;

document.addEventListener("DOMContentLoaded", function () {
	async function refreshToken() {
		try {
			const response = await secureFetch('/api/refresh-token/', {
				method: 'POST',
			});
			if (response.ok) {
				return true;
			}
			return false;
		} catch (error) {
			console.error('Error refreshing token:', error);
			return false;
		}
	}

	async function checkAuth() {
		try {
			const response = await fetch('/api/user/profile/', {
				method: 'GET',
				credentials: 'include',
			});
			const contentType = response.headers.get('content-type');
	
			if (response.ok && contentType.includes('application/json')) {
				const user = await response.json();
				document.dispatchEvent(new CustomEvent('userLoaded', { detail: user }));
				if (!window.rendererHasBeenCreated && typeof window.init3DRenderer === 'function') {
					window.init3DRenderer();
					window.rendererHasBeenCreated = true;
				}
				initPlayersList();
				updateNotificationBadge();
				if(!notificationIntervalId) {
					notificationIntervalId = setInterval(() => {
						updateNotificationBadge();
					}, 5000);
				}
				return;
			}

			if (response.status === 401) {
				const refreshed = await refreshToken();
				if (refreshed) {
					return checkAuth();
				} else {
					displayUnauthenticatedUser();
					return;
				}
			}
			const text = await response.text();
			console.error('Unexpected response:', text);
			displayUnauthenticatedUser();

		} catch (error) {
			console.error('Error checking authentication:', error);
			displayUnauthenticatedUser();
		}
	}

	function logout() {
		secureFetch('/api/logout/', {
			method: 'POST',
		}).then(response => {
			if (response.status === 401) {
				redirectToWelcomePage();
				return;
			}
			if (response.ok) {
				if (window.isInGame)
					exitCurrentGame();
				closePlayersWebsocket();
				closeChatWebsocket();
			} else {
				console.error('Logout failed:', response.statusText);
			}
		}).catch(err => console.error('Logout failed:', err));
	}

	function displayUnauthenticatedUser() {
		const authBtns = document.getElementById('auth-btns');
		if (authBtns) {
			const button = document.createElement('button');
			button.type = 'button';
			button.textContent = translations.loginWith42;
			button.onclick = () => { window.location.href = '/auth/login'; };
			authBtns.appendChild(button);
		}
		const welcomeSection = document.getElementById('welcome-section');
		const mainContent = document.getElementById('main-content');
		if (welcomeSection && mainContent) {
			welcomeSection.classList.remove('hidden');
			mainContent.classList.add('hidden');
		}
	}

	document.addEventListener('logoutRequest', logout);

	window.checkAuth = checkAuth;

	checkAuth();
});

async function redirectToWelcomePage() {
	sessionStorage.clear();
	localStorage.clear();
	
	location.reload();
}
