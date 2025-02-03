function getCSRFToken() {
	return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
}

async function secureFetch(url, options = {}) {
	const csrfToken = getCSRFToken();

	const defaultHeaders = {
		'Content-Type': 'application/json',
		'X-CSRFToken': csrfToken,
	};

	const fetchOptions = {
		...options,
		headers: {
			...defaultHeaders,
			...options.headers,
		},
		credentials: 'include',
	};

	return fetch(url, fetchOptions);
}

function escapeHTML(str) {
	const element = document.createElement('div');
	if (str) {
		element.innerText = str;
		element.textContent = str;
	}
	return element.innerHTML;
}
