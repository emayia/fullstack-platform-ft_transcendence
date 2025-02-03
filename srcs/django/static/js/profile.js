function getProfileCardContent() {
	if (currentUser) {
		const profileCardContent = `
			<div class="profile-card-content">
				<h2 class="card-title">${escapeHTML(translations.Profile)}</h2>
				<div class="profile-pic-container">
					<img src="${escapeHTML(currentUser.image_url || profilePicDefault)}" alt="Profile Picture">
				</div>
				<div class="profile-info">
					<h3 class="profile-name">${escapeHTML(currentUser.first_name)} ${escapeHTML(currentUser.last_name)}</h3>
					<p class="profile-handle">@${escapeHTML(currentUser.username)}</p>
				</div>
				<button class="logout-btn" id="logout-btn">${escapeHTML(translations.logout)}</button>
			</div>
		`;
		return profileCardContent;
	}
}
