function getThemesCardContent() {
	return `
		<h2 class="card-title">${escapeHTML(translations.Themes)}</h2>
		<div class="themes-grid">
			<div class="theme-option" data-video="bg-clouds.mp4">
				<img src="${themeCloudsImg}" alt="Clouds">
				<span>${escapeHTML(translations.Clouds)}</span>
			</div>
			<div class="theme-option" data-video="bg-sunset.mp4">
				<img src="${themeSunsetImg}" alt="Sunset">
				<span>${escapeHTML(translations.Sunset)}</span>
			</div>
			<div class="theme-option" data-video="bg-cherry_blossoms.mp4">
				<img src="${themeCherryImg}" alt="Cherry blossom">
				<span>${escapeHTML(translations.CherryBlossom)}</span>
			</div>
			<div class="theme-option" data-video="bg-nature.mp4">
				<img src="${themeNatureImg}" alt="Nature">
				<span>${escapeHTML(translations.Nature)}</span>
			</div>
			<div class="theme-option" data-video="bg-galaxy.mp4">
				<img src="${themeGalaxyImg}" alt="Galaxy">
				<span>${escapeHTML(translations.Galaxy)}</span>
			</div>
			<div class="theme-option" data-video="bg-fire.mp4">
				<img src="${themeFireImg}" alt="Fire">
				<span>${escapeHTML(translations.Fire)}</span>
			</div>
		</div>
	`;
}

function handleThemeSelection() {
	const adaptiveCard = document.querySelector('.adaptive-card');
	if (!adaptiveCard) return;

	const bgVideo = document.querySelector('.bg-video');
	const themeOptions = adaptiveCard.querySelectorAll('.theme-option');
	if (!themeOptions || !bgVideo) return;

	const savedTheme = localStorage.getItem('selectedTheme');
	if (savedTheme) {
		themeOptions.forEach(to => {
			const dataVideo = to.getAttribute('data-video');
			if (dataVideo === `bg-${savedTheme}.mp4`) {
				to.classList.add('selected');
			}
		});
	} else {
		themeOptions.forEach(to => {
			const dataVideo = to.getAttribute('data-video');
			if (dataVideo === 'bg-clouds.mp4') {
				to.classList.add('selected');
			}
		});
	}

	themeOptions.forEach(thOpt => {
		thOpt.addEventListener('click', () => {
			themeOptions.forEach(to => to.classList.remove('selected'));
			thOpt.classList.add('selected');

			const chosenVideo = thOpt.getAttribute('data-video');
			console.log('Selected theme video:', chosenVideo);

			bgVideo.src = bgBasePath + chosenVideo;

			const selectedTheme = chosenVideo.replace('bg-', '').replace('.mp4', '');
			localStorage.setItem('selectedTheme', selectedTheme);

			const event = new CustomEvent('themeChange', { detail: { theme: selectedTheme } });
			document.dispatchEvent(event);
		});
	});
}

document.addEventListener('DOMContentLoaded', () => {
	const bgVideo = document.querySelector('.bg-video');
	const savedTheme = localStorage.getItem('selectedTheme');
	if (bgVideo) {
		if (savedTheme) {
			bgVideo.src = bgBasePath + 'bg-' +  savedTheme + '.mp4';
		} else {
			bgVideo.src = defaultBg;
		}

		const initialTheme = savedTheme || 'clouds';
		console.log('Initial theme on load:', initialTheme);
		const event = new CustomEvent('themeChange', { detail: { theme: initialTheme } });
		document.dispatchEvent(event);
	}
});
