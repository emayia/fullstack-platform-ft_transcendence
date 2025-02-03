let currentHash = '';
let previousHash = '';
let isHandlingPopState = false;

const routes = {
	welcome: '#/welcome',
	homepage: '#/homepage',
	profile: '#/profile',
	players: '#/players',
	messages: '#/messages',
	tournament: '#/tournament',
	languages: '#/languages',
	themes: '#/themes'
};

function initHashRouter() {
	handleInitialHash();

	window.addEventListener('hashchange', handleHashChange);
	window.addEventListener('popstate', handlePopState);

	document.addEventListener('userLoaded', handleUserLoaded);

	create404Section();
}

function create404Section() {
	let notFoundSection = document.getElementById('not-found-section');
	if (!notFoundSection) {
		notFoundSection = document.createElement('div');
		notFoundSection.id = 'not-found-section';
		notFoundSection.className = 'hidden';
		notFoundSection.innerHTML = `
			<div class="not-found-content">
				<img src="${notFoundGif}" alt="404 Not Found" class="not-found-gif">
				<h1>404</h1>
				<p>Page not found</p>
				<button onclick="window.location.hash = '${routes.homepage}'">
					Return to Homepage
				</button>
			</div>
		`;
		document.querySelector('.base-container').appendChild(notFoundSection);
	}
}

function handleInitialHash() {
	const hash = window.location.hash || routes.welcome;
	navigateToHash(hash, true);
}

function handleUserLoaded(event) {
	if (event.detail && (window.location.hash === '' || window.location.hash === routes.welcome)) {
		navigateToHash(routes.homepage);
	}
}

function handleHashChange(event) {
	if (!isHandlingPopState) {
		const newHash = window.location.hash;
		navigateToHash(newHash);
	}
}

function handlePopState(event) {
	isHandlingPopState = true;
	const newHash = window.location.hash;
	navigateToHash(newHash);
	setTimeout(() => {
		isHandlingPopState = false;
	}, 0);
}

function show404Page() {
	const sections = ['welcome-section', 'main-content', 'not-found-section'];
	sections.forEach(id => {
		const element = document.getElementById(id);
		if (element) {
			element.classList.add('hidden');
		}
	});

	const notFoundSection = document.getElementById('not-found-section');
	if (notFoundSection) {
		notFoundSection.classList.remove('hidden');
	}

	const adaptiveCard = document.querySelector('.adaptive-card');
	if (adaptiveCard) {
		adaptiveCard.classList.add('hidden');
	}
}

function isValidRoute(hash) {
	return Object.values(routes).includes(hash);
}

function navigateToHash(hash, isInitial = false) {
	if (hash === currentHash) return;

	previousHash = currentHash;
	currentHash = hash;

	if (!isValidRoute(hash)) {
		show404Page();
		return;
	}

	const notFoundSection = document.getElementById('not-found-section');
	if (notFoundSection) {
		notFoundSection.classList.add('hidden');
	}

	switch (hash) {
		case routes.welcome:
			handleWelcomeRoute();
			break;
		case routes.homepage:
			handleHomepageRoute();
			break;
		case routes.profile:
		case routes.players:
		case routes.messages:
		case routes.tournament:
		case routes.languages:
		case routes.themes:
			handleNavRoute(hash);
			break;
		default:
			if (!isInitial) {
				navigateToHash(routes.homepage);
			}
	}
}

function handleWelcomeRoute() {
	const welcomeSection = document.getElementById('welcome-section');
	const mainContent = document.getElementById('main-content');
	if (welcomeSection && mainContent) {
		welcomeSection.classList.remove('hidden');
		mainContent.classList.add('hidden');
	}
}

function handleHomepageRoute() {
	const welcomeSection = document.getElementById('welcome-section');
	const mainContent = document.getElementById('main-content');
	if (welcomeSection && mainContent) {
		welcomeSection.classList.add('hidden');
		mainContent.classList.remove('hidden');
	}
	const adaptiveCard = document.querySelector('.adaptive-card');
	if (adaptiveCard) {
		adaptiveCard.classList.add('hidden');
	}
}

function handleNavRoute(hash) {
	const routeToClass = {
		[routes.profile]: 'profile',
		[routes.players]: 'players',
		[routes.messages]: 'messages',
		[routes.tournament]: 'tournament',
		[routes.languages]: 'languages',
		[routes.themes]: 'themes'
	};

	const navClass = routeToClass[hash];
	if (navClass) {
		const navBtn = document.querySelector(`.nav-btn.${navClass}`);
		if (navBtn) {
			navBtn.click();
		}
	}
}

function updateHash(section) {
	const hash = routes[section] || routes.homepage;
	if (hash !== window.location.hash) {
		isHandlingPopState = true;
		window.location.hash = hash;
		setTimeout(() => {
			isHandlingPopState = false;
		}, 0);
	}
}

window.initHashRouter = initHashRouter;

window.hashRouter = {
	updateHash,
	routes
};
