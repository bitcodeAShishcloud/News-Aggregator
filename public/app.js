// Show/hide sections for navigation
function showSection(sectionId) {
	document.getElementById('news-feed').style.display = 'none';
	document.getElementById('login-form').style.display = 'none';
	document.getElementById('register-form').style.display = 'none';

	document.getElementById(sectionId).style.display = 'block';

	if (sectionId === 'news-feed') {
		loadNews();
	}
}

// Fetch and display news articles
async function loadNews() {
	const feed = document.getElementById('news-feed');
	feed.innerHTML = '<p>Loading news...</p>';

	try {
		const res = await fetch('feed.php');

		// ✅ Check HTTP status
		if (!res.ok) {
			throw new Error("HTTP error: " + res.status);
		}

		// ✅ Get raw response safely
		const text = await res.text();
		console.log("RAW RESPONSE:", text);

		// ✅ Clean unexpected characters (InfinityFree fix)
		const cleanText = text.trim();

		let articles;
		try {
			articles = JSON.parse(cleanText);
		} catch (err) {
			console.error("JSON Parse Error:", err);
			throw new Error("Invalid JSON response");
		}

		console.log("Parsed Articles:", articles);

		// ✅ Handle empty data
		if (!articles || articles.length === 0) {
			feed.innerHTML = '<p>No news articles found.</p>';
			return;
		}

		// ✅ Render articles
		feed.innerHTML = articles.map(article => `
			<article class="news-article">
				<h3>
					<a href="${article.url}" target="_blank">
						${article.title || 'No Title'}
					</a>
				</h3>
				<small>
					${article.source || 'Unknown'} |
					${article.published_at ? new Date(article.published_at).toLocaleString() : ''}
				</small>
				<p>
					${article.content ? article.content.substring(0, 200) + '...' : 'No description available.'}
				</p>
			</article>
		`).join('');

	} catch (e) {
		console.error("FINAL ERROR:", e);

		feed.innerHTML = `
			<p style="color:red;">
				Error loading news.<br>
				Check console (F12) for details.
			</p>
		`;
	}
}

// Show news feed by default
showSection('news-feed');