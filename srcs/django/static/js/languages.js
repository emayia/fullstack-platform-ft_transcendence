function getLanguagesCardContent() {
	return `
	<h2 class="card-title">${escapeHTML(translations.Languages)}</h2>
	<div class="languages-card-content">
		<div class="language-option" data-lang="en">
			<img src="${langEnImg}" alt="English">
			<p>English</p>
		</div>
		<div class="language-option" data-lang="fr">
			<img src="${langFrImg}" alt="French">
			<p>Français</p>
		</div>
		<div class="language-option" data-lang="ko">
			<img src="${langKrImg}" alt="Korean">
			<p>한글</p>
		</div>
		<div class="language-option" data-lang="ru">
			<img src="${langRuImg}" alt="Russian">
			<p>русский</p>
		</div>
	</div>
	`;
}

function handleLanguageSelection() {
	const adaptiveCard = document.querySelector('.adaptive-card');
	if (!adaptiveCard) return;

	const languageOptions = adaptiveCard.querySelectorAll('.language-option');
	if (languageOptions.length > 0) {
		let savedLang = localStorage.getItem('selectedLanguage');
		if (!savedLang) {
			savedLang = 'en';
			localStorage.setItem('selectedLanguage', 'en');
		}

		languageOptions.forEach(lo => {
			if (lo.getAttribute('data-lang') === savedLang) {
				lo.classList.add('selected');
			} else {
				lo.classList.remove('selected');
			}
		});

		languageOptions.forEach(langOpt => {
			langOpt.addEventListener('click', () => {
				languageOptions.forEach(lo => lo.classList.remove('selected'));
				langOpt.classList.add('selected');
				const chosenLang = langOpt.getAttribute('data-lang');
				console.log('Selected language:', chosenLang);
				localStorage.setItem('selectedLanguage', chosenLang);
				changeLanguage(chosenLang);
			});
		});
	}
}

async function changeLanguage(lang) {
	const currentLang = document.documentElement.lang || 'en';
	const url = `/${currentLang}/set-language/`;
	console.log("url: ", url);
	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'X-CSRFToken': getCSRFToken(),
			},
			body: `language=${lang}`,
		});
		if(response.status === 401) {
			redirectToWelcomePage();
			return;
		}
		if (response.ok) {
			console.log("Language changed successfully");
			location.reload();
		} else {
			console.error(`Failed to change language. Status: ${response.status} ${response.statusText}`);
			const errorDetails = await response.text();
			console.error(`Error details: ${errorDetails}`);
		}
	} catch (error) {
		console.error('An unexpected error occurred:', error);
	}
}
