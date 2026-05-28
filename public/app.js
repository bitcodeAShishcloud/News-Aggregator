// Global variable to store all articles
let allArticles = [];
let displayedArticles = [];
let currentOffset = 0;
let totalArticles = 0;
let hasMoreArticles = false;
let isLoading = false;
const articlesPerPage = 20;
let currentFilters = {
	search: '',
	category: '',
	source: '',
	type: ''
};
let scrollObserver = null;
let savedArticleIds = new Set();
let isLoggedIn = false;

// ===== THEME SYSTEM (Dark / Light / System) =====
let systemThemeQuery = window.matchMedia('(prefers-color-scheme: light)');

function getStoredThemeMode() {
	return localStorage.getItem('themeMode') || localStorage.getItem('theme') || null;
}

function getEffectiveTheme(mode) {
	if (mode === 'system' || !mode) {
		return systemThemeQuery.matches ? 'light' : 'dark';
	}
	return mode;
}

function applyTheme(effectiveTheme) {
	if (effectiveTheme === 'light') {
		document.body.classList.add('light-theme');
		document.documentElement.classList.add('light-theme');
	} else {
		document.body.classList.remove('light-theme');
		document.documentElement.classList.remove('light-theme');
	}
	syncThemeIcon(effectiveTheme);
}

function syncThemeIcon(effectiveTheme) {
	const icon = document.getElementById('theme-icon');
	if (!icon) return;
	icon.className = effectiveTheme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
}

// Called from the header button — directly toggles between explicit dark and light
function toggleTheme() {
	const currentMode = getStoredThemeMode() || 'system';
	const effectiveTheme = getEffectiveTheme(currentMode);

	// If it currently looks light, switch to explicit dark. Otherwise, switch to explicit light.
	const next = effectiveTheme === 'light' ? 'dark' : 'light';
	setThemeMode(next);
}

// Called from the Settings 3-option selector
function setThemeMode(mode) {
	localStorage.setItem('themeMode', mode);
	// Clean up old key
	localStorage.removeItem('theme');
	const effective = getEffectiveTheme(mode);
	applyTheme(effective);
	syncSettingsSelector(mode);

	// Sync to database if logged in
	if (isLoggedIn) {
		const fd = new FormData();
		fd.append('theme', mode);
		fetch('preferences_api.php?action=save_theme', { method: 'POST', body: fd }).catch(() => { });
	}
}

// Sync the Settings modal 3-option selector UI
function syncSettingsSelector(mode) {
	if (!mode) mode = getStoredThemeMode() || 'dark';
	const effective = getEffectiveTheme(mode);

	// Update pill position
	const pill = document.getElementById('theme-selector-pill');
	if (pill) {
		const posMap = { dark: '0', light: '1', system: '2' };
		pill.setAttribute('data-pos', posMap[mode] || '0');
	}

	// Update active button
	document.querySelectorAll('.theme-selector-btn').forEach(btn => {
		btn.classList.toggle('active', btn.getAttribute('data-theme') === mode);
	});

	// Update description
	const desc = document.getElementById('theme-selector-desc');
	if (desc) {
		const msgs = {
			dark: 'Dark theme is active.',
			light: 'Light theme is active.',
			system: `Following system preference (${effective === 'light' ? 'Light' : 'Dark'}).`
		};
		desc.textContent = msgs[mode] || '';
	}
}

// Keep old function name for backward compat (settings modal open)
function syncSettingsToggle() {
	syncSettingsSelector();
}

// Listen for OS theme changes when in "system" mode
systemThemeQuery.addEventListener('change', () => {
	const mode = getStoredThemeMode();
	if (mode === 'system') {
		applyTheme(getEffectiveTheme('system'));
		syncSettingsSelector('system');
	}
});

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
	const stored = getStoredThemeMode();
	const mode = stored || 'system';
	const effective = getEffectiveTheme(mode);
	applyTheme(effective);
	syncSettingsSelector(mode);
});




// SVG Icons for bookmark star
const starOutlineSVG = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>';
const starFilledSVG = '<svg viewBox="0 0 24 24" width="20" height="20" fill="#f59e0b" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>';

// Check user session on page load
async function checkUserSession() {
	try {
		const res = await fetch('check_session.php');
		const data = await res.json();

		if (data.loggedIn) {
			// User is logged in
			const loginBtn = document.getElementById('login-link');
			if (loginBtn) loginBtn.style.display = 'none';
			document.getElementById('user-menu').style.display = 'inline-block';
			const myFeedLink = document.getElementById('my-feed-link');
			if (myFeedLink) myFeedLink.style.display = 'inline-block';

			const username = data.username;
			const initial = username.charAt(0).toUpperCase();

			document.getElementById('username-display').textContent = username;
			document.getElementById('dropdown-username').textContent = username;

			// Apply saved avatar SVG icon + color
			const savedIndex = parseInt(localStorage.getItem('avatarThemeIndex') || '0');
			const avatarIcons = [
				{ bg: '#6b8f71', icon: '<svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="3" fill="white"/><line x1="20" y1="6" x2="20" y2="14" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="20" y1="26" x2="20" y2="34" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="6" y1="20" x2="14" y2="20" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="26" y1="20" x2="34" y2="20" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="10" y1="10" x2="15" y2="15" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="25" y1="25" x2="30" y2="30" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="30" y1="10" x2="25" y2="15" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="15" y1="25" x2="10" y2="30" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>' },
				{ bg: '#b8c4d0', icon: '<svg viewBox="0 0 40 40" fill="none"><circle cx="12" cy="12" r="3" fill="#7a9bb5"/><circle cx="20" cy="12" r="3" fill="#7a9bb5"/><circle cx="28" cy="12" r="3" fill="#7a9bb5"/><circle cx="12" cy="20" r="3" fill="#7a9bb5"/><circle cx="20" cy="20" r="3" fill="#7a9bb5"/><circle cx="28" cy="20" r="3" fill="#7a9bb5"/><circle cx="12" cy="28" r="3" fill="#7a9bb5"/><circle cx="20" cy="28" r="3" fill="#7a9bb5"/><circle cx="28" cy="28" r="3" fill="#7a9bb5"/></svg>' },
				{ bg: '#7c9885', icon: '<svg viewBox="0 0 40 40" fill="none"><rect x="8" y="26" width="8" height="8" rx="1.5" fill="white" opacity="0.9"/><rect x="16" y="18" width="8" height="16" rx="1.5" fill="white" opacity="0.9"/><rect x="24" y="10" width="8" height="24" rx="1.5" fill="white" opacity="0.9"/></svg>' },
				{ bg: '#4a5568', icon: '<svg viewBox="0 0 40 40" fill="none"><rect x="10" y="10" width="8" height="8" rx="2" fill="#68d391"/><rect x="22" y="10" width="8" height="8" rx="2" fill="#68d391"/><rect x="10" y="22" width="8" height="8" rx="2" fill="#68d391"/><rect x="22" y="22" width="8" height="8" rx="2" fill="#68d391"/><line x1="18" y1="14" x2="22" y2="14" stroke="#68d391" stroke-width="2"/><line x1="18" y1="26" x2="22" y2="26" stroke="#68d391" stroke-width="2"/><line x1="14" y1="18" x2="14" y2="22" stroke="#68d391" stroke-width="2"/><line x1="26" y1="18" x2="26" y2="22" stroke="#68d391" stroke-width="2"/></svg>' },
				{ bg: '#c4b5d4', icon: '<svg viewBox="0 0 40 40" fill="none"><ellipse cx="20" cy="16" rx="5" ry="6" fill="#7c5ba8" opacity="0.8"/><ellipse cx="14" cy="23" rx="5" ry="6" fill="#7c5ba8" opacity="0.7"/><ellipse cx="26" cy="23" rx="5" ry="6" fill="#7c5ba8" opacity="0.7"/><circle cx="20" cy="20" r="3" fill="#ddd0ee"/></svg>' },
				{ bg: '#d4956b', icon: '<svg viewBox="0 0 40 40" fill="none"><polygon points="20,6 34,14 34,26 20,34 6,26 6,14" stroke="white" stroke-width="2.5" fill="none"/><polygon points="20,12 28,16 28,24 20,28 12,24 12,16" stroke="white" stroke-width="2" fill="white" opacity="0.2"/></svg>' },
				{ bg: '#5b7fa5', icon: '<svg viewBox="0 0 40 40" fill="none"><path d="M20 8 L20 32" stroke="white" stroke-width="2.5" stroke-linecap="round"/><path d="M12 14 L20 8 L28 14" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/><circle cx="12" cy="20" r="3" fill="white" opacity="0.7"/><circle cx="28" cy="20" r="3" fill="white" opacity="0.7"/><circle cx="12" cy="28" r="3" fill="white" opacity="0.5"/><circle cx="28" cy="28" r="3" fill="white" opacity="0.5"/></svg>' },
				{ bg: '#8b6f5e', icon: '<svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="12" stroke="white" stroke-width="2.5" fill="none"/><circle cx="20" cy="20" r="6" stroke="white" stroke-width="2" fill="none"/><circle cx="20" cy="20" r="2" fill="white"/></svg>' },
				{ bg: '#5e8b7f', icon: '<svg viewBox="0 0 40 40" fill="none"><path d="M8 28 Q14 10, 20 20 Q26 30, 32 12" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/><circle cx="8" cy="28" r="2.5" fill="white"/><circle cx="32" cy="12" r="2.5" fill="white"/></svg>' },
				{ bg: '#a0855b', icon: '<svg viewBox="0 0 40 40" fill="none"><polygon points="20,7 24,17 34,17 26,23 29,33 20,27 11,33 14,23 6,17 16,17" fill="white" opacity="0.85"/></svg>' },
				{ bg: '#7a8b9e', icon: '<svg viewBox="0 0 40 40" fill="none"><path d="M10 30 L20 10 L30 30 Z" stroke="white" stroke-width="2.5" fill="none" stroke-linejoin="round"/><line x1="14" y1="24" x2="26" y2="24" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>' },
				{ bg: '#9b6b8a', icon: '<svg viewBox="0 0 40 40" fill="none"><rect x="14" y="8" width="12" height="12" rx="2" fill="white" opacity="0.85" transform="rotate(45 20 14)"/><rect x="14" y="20" width="12" height="12" rx="2" fill="white" opacity="0.6" transform="rotate(45 20 26)"/></svg>' },
				{ bg: '#6b8fa0', icon: '<svg viewBox="0 0 40 40" fill="none"><circle cx="14" cy="14" r="6" fill="white" opacity="0.7"/><circle cx="26" cy="14" r="6" fill="white" opacity="0.5"/><circle cx="20" cy="25" r="6" fill="white" opacity="0.6"/></svg>' },
				{ bg: '#8fa06b', icon: '<svg viewBox="0 0 40 40" fill="none"><rect x="8" y="8" width="10" height="10" rx="2" fill="white" opacity="0.85"/><rect x="22" y="8" width="10" height="10" rx="2" fill="white" opacity="0.6"/><rect x="8" y="22" width="10" height="10" rx="2" fill="white" opacity="0.6"/><rect x="22" y="22" width="10" height="10" rx="2" fill="white" opacity="0.45"/></svg>' },
				{ bg: '#8b5e5e', icon: '<svg viewBox="0 0 40 40" fill="none"><path d="M20 8 C28 8, 32 14, 32 20 C32 28, 24 32, 20 32 C12 32, 8 24, 8 20 C8 12, 16 8, 20 8 Z" fill="none" stroke="white" stroke-width="2.5"/><path d="M20 14 C24 14, 26 17, 26 20 C26 24, 22 26, 20 26" fill="none" stroke="white" stroke-width="2" opacity="0.7"/></svg>' },
			];
			const theme = avatarIcons[savedIndex % avatarIcons.length];
			document.getElementById('user-avatar').style.background = theme.bg;
			document.getElementById('user-avatar').innerHTML = theme.icon;
			document.getElementById('dropdown-avatar').style.background = theme.bg;
			document.getElementById('dropdown-avatar').innerHTML = theme.icon;
			isLoggedIn = true;
			await loadSavedArticleIds();

			// Apply user's saved theme from database
			if (data.theme) {
				setThemeMode(data.theme);
			}

			// Onboarding Check
			if (data.needs_onboarding) {
				document.getElementById('onboardingModal').style.display = 'flex';
			}
		} else {
			// User is not logged in
			isLoggedIn = false;
			const loginBtn = document.getElementById('login-link');
			if (loginBtn) loginBtn.style.display = 'flex';
			document.getElementById('user-menu').style.display = 'none';
			const myFeedLink = document.getElementById('my-feed-link');
			if (myFeedLink) myFeedLink.style.display = 'none';
		}
	} catch (e) {
		console.error('Session check failed:', e);
	}
}

// Logout function
async function logout() {
	try {
		await fetch('logout.php');
		location.reload();
	} catch (e) {
		console.error('Logout failed:', e);
	}
}

// Show/hide sections for navigation
function showSection(sectionId, el) {
	// Update active state in navigation
	document.querySelectorAll('.nav-link').forEach(link => {
		link.classList.remove('active');
	});

	if (el) {
		el.classList.add('active');
		updateNavIndicator(el);
	} else {
		// Try to find the link by text if el is not provided
		const links = document.querySelectorAll('.header-center .nav-link');
		links.forEach(l => {
			if (l.textContent.toLowerCase().includes(sectionId.split('-')[0])) {
				l.classList.add('active');
				updateNavIndicator(l);
			}
		});
	}

	document.getElementById('news-feed').style.display = 'none';
	const forgotEl = document.getElementById('forgot-password');
	if (forgotEl) forgotEl.style.display = 'none';

	document.getElementById(sectionId).style.display = 'block';

	if (sectionId === 'news-feed') {
		currentFilters.type = ''; // Reset personalized
		loadNews();
		updateBottomNav('nav-home');
	}
}

function updateBottomNav(activeId) {
	document.querySelectorAll('.bottom-nav-item').forEach(el => el.classList.remove('active'));
	const activeEl = document.getElementById(activeId);
	if (activeEl) activeEl.classList.add('active');
}

// Generate skeleton loader HTML
function generateSkeletonHTML(count = 6) {
	let skeletons = '';
	for (let i = 0; i < count; i++) {
		skeletons += `
			<article class="news-article skeleton-card" style="animation-delay: ${i * 0.08}s">
				<div class="article-image skeleton-image">
					<div class="skeleton-shimmer"></div>
				</div>
				<div class="article-content">
					<div class="skeleton-line skeleton-title"></div>
					<div class="skeleton-line skeleton-title short"></div>
					<div class="skeleton-meta-row">
						<div class="skeleton-line skeleton-meta"></div>
					</div>
					<div class="skeleton-line skeleton-desc"></div>
					<div class="skeleton-line skeleton-desc"></div>
					<div class="skeleton-line skeleton-desc short"></div>
					<div class="skeleton-line skeleton-btn"></div>
				</div>
			</article>
		`;
	}
	return skeletons;
}

// Fetch and display news articles
async function loadNews(append = false) {
	if (isLoading) return;
	isLoading = true;

	const container = document.getElementById('articles-container');

	if (!append) {
		container.innerHTML = generateSkeletonHTML(6);
		currentOffset = 0;
		allArticles = [];
		displayedArticles = [];
	} else {
		// Show a small inline loading indicator at the bottom
		showScrollLoadingIndicator(true);
	}

	// Build URL with filters
	let url = `feed.php?offset=${currentOffset}&limit=${articlesPerPage}`;
	if (currentFilters.type) {
		url += `&type=${encodeURIComponent(currentFilters.type)}`;
	}
	if (currentFilters.category && currentFilters.type !== 'personalized') {
		url += `&category=${encodeURIComponent(currentFilters.category)}`;
	}
	if (currentFilters.source) {
		url += `&source=${encodeURIComponent(currentFilters.source)}`;
	}

	try {
		const res = await fetch(url);

		// ✅ Check HTTP status
		if (!res.ok) {
			throw new Error("HTTP error: " + res.status);
		}

		// ✅ Get raw response safely
		const text = await res.text();
		console.log("RAW RESPONSE:", text.substring(0, 200));

		// ✅ Clean unexpected characters (InfinityFree fix)
		const cleanText = text.trim();

		let data;
		try {
			data = JSON.parse(cleanText);
		} catch (err) {
			console.error("JSON Parse Error:", err);
			console.error("Response text:", cleanText.substring(0, 500));
			throw new Error("Invalid JSON response");
		}

		console.log("Parsed Data:", data);

		// Handle new response format with pagination
		let articles;
		if (data.articles) {
			// New format with pagination metadata
			articles = data.articles;
			totalArticles = data.total || 0;
			hasMoreArticles = data.hasMore || false;
		} else if (Array.isArray(data)) {
			// Old format - array of articles
			articles = data;
			totalArticles = articles.length;
			hasMoreArticles = false;
		} else {
			articles = [];
			totalArticles = 0;
			hasMoreArticles = false;
		}

		// ✅ Handle empty data
		if (!articles || articles.length === 0) {
			if (!append) {
				if (currentFilters.type === 'personalized') {
					container.innerHTML = `
						<div style="text-align: center; padding: 4rem 1rem; color: #94a3b8; display: flex; flex-direction: column; align-items: center; justify-content: center; grid-column: 1 / -1; width: 100%;">
							<div style="width: 64px; height: 64px; border-radius: 50%; background: rgba(100, 181, 246, 0.1); display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem;">
								<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#64b5f6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
							</div>
							<h3 style="color: #e2e8f0; font-size: 1.25rem; margin-bottom: 0.5rem; font-weight: 600;">Your feed is empty</h3>
							<p style="margin-bottom: 1.5rem; max-width: 320px; line-height: 1.6; font-size: 0.95rem;">You haven't selected any favorite categories yet, or there's no recent news in your chosen topics.</p>
							<button class="settings-save-btn" onclick="openPersonalizationModal()" style="padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 500; font-size: 0.9rem; transition: all 0.2s;">Setup My Feed</button>
						</div>
					`;
				} else {
					container.innerHTML = `
						<div style="text-align: center; padding: 3rem 1rem; background: rgba(255,255,255,0.02); border-radius: 12px; margin: 2rem 0; grid-column: 1 / -1; width: 100%;">
							<p style="color: #94a3b8; font-size: 1rem;">No news articles found.</p>
						</div>
					`;
				}
			}
			hasMoreArticles = false;
			showScrollLoadingIndicator(false);
			setupInfiniteScroll();
			isLoading = false;
			return;
		}

		// Apply search filter if active (only to the newly fetched articles)
		let newArticlesToRender = articles;
		if (currentFilters.search) {
			newArticlesToRender = articles.filter(article => {
				return (article.title && article.title.toLowerCase().includes(currentFilters.search)) ||
					(article.content && article.content.toLowerCase().includes(currentFilters.search));
			});
		}

		// Store articles globally
		if (append) {
			allArticles = allArticles.concat(articles);
			displayedArticles = displayedArticles.concat(newArticlesToRender);
		} else {
			allArticles = articles;
			displayedArticles = newArticlesToRender;
		}

		// Populate source filter dropdown (only on initial load)
		if (!append && !currentFilters.category && !currentFilters.source) {
			populateSourceFilter(allArticles);
		}

		// ✅ Handle Hero Article vs Grid
		const isSearching = currentFilters.search;
		const isCategoryOrSourceFilter = currentFilters.category || currentFilters.source;
		const isPersonalized = currentFilters.type === 'personalized';
		const heroSection = document.getElementById('hero-section');

		// Show hero only on "Main" feed (no search, no specific category/source)
		// But ALWAYS show if the first article is explicitly 'featured' by admin
		const firstArticle = newArticlesToRender[0];
		const isFeaturedByAdmin = firstArticle && firstArticle.is_featured == 1;
		const shouldShowHero = !append && ((!isSearching && !isCategoryOrSourceFilter && !isPersonalized) || isFeaturedByAdmin);

		if (shouldShowHero && firstArticle) {
			if (heroSection) heroSection.style.setProperty('display', 'flex', 'important');
			renderHeroArticle(firstArticle);
			renderArticles(newArticlesToRender.slice(1), append);
		} else {
			if (heroSection && !append) heroSection.style.display = 'none';
			renderArticles(newArticlesToRender, append);
		}

		// Update offset for next load
		currentOffset += articles.length;

		// Setup infinite scroll observer
		showScrollLoadingIndicator(false);
		setupInfiniteScroll();

	} catch (e) {
		console.error("FINAL ERROR:", e);

		if (!append) {
			container.innerHTML = `
				<div class="error-message">
					<p>⚠️ Error loading news.</p>
					<p>Check console (F12) for details.</p>
				</div>
			`;
		}
		showScrollLoadingIndicator(false);
	}
	isLoading = false;
}

// Render the large Hero section article
function renderHeroArticle(article) {
	const heroSection = document.getElementById('hero-section');
	if (!heroSection) return;

	const category = article.category || 'General';
	const title = article.title || 'No Title';
	const content = article.content ? (article.content.substring(0, 180) + '...') : '';
	const imageUrl = article.image_url || '';
	const articleId = article.article_id;

	// Update background image
	if (imageUrl) {
		heroSection.style.backgroundImage = `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.8)), url('${imageUrl}')`;
		heroSection.style.backgroundSize = 'cover';
		heroSection.style.backgroundPosition = 'center';
	} else {
		heroSection.style.background = '#1a1f2e';
	}

	// Update content
	heroSection.innerHTML = `
		<div class="hero-content">
			<div class="hero-badges">
				<span class="badge trending"><i class="fas fa-arrow-trend-up"></i> ${article.is_featured == 1 ? 'FEATURED' : 'TRENDING'}</span>
				<span class="badge category">${category.toUpperCase()}</span>
			</div>
			<h2>${title}</h2>
			<p>${content}</p>
			<div class="hero-actions">
				<button class="read-full-btn" onclick="openArticleReader('${articleId}')">
					Read Full Article <i class="fas fa-arrow-right"></i>
				</button>
				<div class="hero-meta">
					<span class="date">Today</span>
				</div>
			</div>
		</div>
	`;
}

// Render articles to the page
function renderArticles(articles, append = false) {
	const container = document.getElementById('articles-container');

	if (!articles || articles.length === 0) {
		if (!append) {
			container.innerHTML = '<p class="no-articles">No articles match your filters.</p>';
		}
		return;
	}

	// Helper function to highlight search keywords
	const searchKeyword = currentFilters.search ? currentFilters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';

	function highlightText(text) {
		if (!searchKeyword || !text) return text;
		const regex = new RegExp(`(${searchKeyword})`, 'gi');
		return text.replace(regex, '<mark class="search-highlight">$1</mark>');
	}

	const fallbackImage = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22220%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%231e293b%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22sans-serif%22%20font-size%3D%2224%22%20fill%3D%22%2394a3b8%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E';

	const articlesHTML = articles.map((article, index) => {
		const imageUrl = article.image_url || fallbackImage;
		const category = article.category || 'general';
		const publishedDate = article.published_at ? new Date(article.published_at).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		}) : '';

		const rawTitle = article.title || 'No Title';
		const rawDesc = article.content ? article.content.substring(0, 150) + '...' : 'No description available.';

		const titleToRender = highlightText(rawTitle);
		const descToRender = highlightText(rawDesc);

		const articleId = article.article_id || '';
		const isSaved = articleId && savedArticleIds.has(String(articleId));
		const bookmarkBtnHTML = articleId ? `
			<button class="bookmark-btn ${isSaved ? 'saved' : ''}" data-article-id="${articleId}" onclick="event.stopPropagation(); toggleBookmark(event, ${articleId})" title="${isSaved ? 'Remove bookmark' : 'Save for later'}">
				${isSaved ? starFilledSVG : starOutlineSVG}
			</button>` : '';

		return `
			<article class="news-article" data-category="${category}" data-source="${article.source || ''}" data-article-id="${articleId}" onclick="openArticleReader('${articleId}')" style="animation-delay: ${(index % 20) * 0.05}s; cursor: pointer;">
				<div class="article-image">
					<span class="category-badge desktop-only">${category}</span>
					<span class="mobile-category-badge mobile-only">${category}</span>
					${bookmarkBtnHTML}
					<img src="${imageUrl}" alt="${rawTitle}" onerror="this.onerror=null; this.src='${fallbackImage}'" loading="lazy">
				</div>
				<div class="article-content">
					<h3>
						<a href="${article.url}" target="_blank" rel="noopener noreferrer" onclick="event.preventDefault(); event.stopPropagation(); openArticleReader('${articleId}'); return false;">
							${titleToRender}
						</a>
					</h3>
					<p class="article-description">
						${descToRender}
					</p>
					<div class="article-meta">
						<span class="mobile-source mobile-only">${article.source || 'News'} <i class="fas fa-check-circle mobile-verified"></i></span>
						<span class="mobile-dot mobile-only" style="margin: 0 4px; font-size: 0.5rem; color: #64748b;">•</span>
						<span class="date">${publishedDate}</span>
					</div>
				</div>
			</article>
		`;
	}).join('');

	if (append) {
		container.insertAdjacentHTML('beforeend', articlesHTML);
	} else {
		container.innerHTML = articlesHTML;
	}
}

// ===== Infinite Scroll =====
function setupInfiniteScroll() {
	// Disconnect previous observer if any
	if (scrollObserver) {
		scrollObserver.disconnect();
	}

	// Remove old sentinel
	const oldSentinel = document.getElementById('scroll-sentinel');
	if (oldSentinel) oldSentinel.remove();

	if (!hasMoreArticles || allArticles.length === 0) return;

	// Create a sentinel element below articles
	const sentinel = document.createElement('div');
	sentinel.id = 'scroll-sentinel';
	sentinel.style.height = '1px';
	const container = document.getElementById('articles-container');
	container.insertAdjacentElement('afterend', sentinel);

	scrollObserver = new IntersectionObserver(handleIntersect, {
		root: null,
		rootMargin: '300px', // trigger 300px before reaching end
		threshold: 0
	});
	scrollObserver.observe(sentinel);
}

function handleIntersect(entries) {
	entries.forEach(entry => {
		if (entry.isIntersecting && hasMoreArticles && !isLoading) {
			loadNews(true);
		}
	});
}

// Show/hide small loading indicator during infinite scroll
function showScrollLoadingIndicator(show) {
	let indicator = document.getElementById('scroll-loading');
	if (show) {
		if (!indicator) {
			indicator = document.createElement('div');
			indicator.id = 'scroll-loading';
			indicator.className = 'scroll-loading';
			indicator.innerHTML = '<div class="scroll-spinner"></div><p>Loading more articles...</p>';
			const container = document.getElementById('articles-container');
			container.insertAdjacentElement('afterend', indicator);
		}
	} else {
		if (indicator) indicator.remove();
	}
}

// Populate source filter dropdown with unique sources
function populateSourceFilter(articles) {
	const sourceOptions = document.getElementById('source-options');
	if (!sourceOptions) return;

	// Get all unique sources from loaded articles
	const sources = [...new Set(articles.map(a => a.source).filter(s => s))];

	// Sort sources alphabetically (ascending order)
	sources.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

	// Rebuild options list
	let html = `
		<div class="option ${!currentFilters.source ? 'active selected' : ''}" onclick="selectCustomOption('source', '', 'All Sources', 'fa-globe')">
			<i class="fas fa-globe"></i> All Sources
		</div>
	`;

	sources.forEach(source => {
		const isSelected = currentFilters.source === source;
		html += `
			<div class="option ${isSelected ? 'active selected' : ''}" onclick="selectCustomOption('source', '${source.replace(/'/g, "\\'")}', '${source.replace(/'/g, "\\'")}', 'fa-globe')">
				<i class="fas fa-globe"></i> ${source}
			</div>
		`;
	});

	sourceOptions.innerHTML = html;
}

// Filter news based on search and category
function filterNews() {
	const searchTerm = document.getElementById('search-input').value.toLowerCase();

	// Update current filters (category and source are updated by selectCustomOption)
	currentFilters.search = searchTerm;

	// Reset and reload with new filters
	currentOffset = 0;
	allArticles = [];
	displayedArticles = [];

	// Load news with filters
	loadNews(false);
}

// Initialize on page load
(async function init() {
	await checkUserSession();
	showSection('news-feed');

	// Initial indicator position
	const activeLink = document.querySelector('.header-center .nav-link.active');
	if (activeLink) {
		setTimeout(() => updateNavIndicator(activeLink), 100);
	}

	window.addEventListener('resize', () => {
		const active = document.querySelector('.header-center .nav-link.active');
		if (active) updateNavIndicator(active);
	});

	// Check for deep link (article open on load)
	const urlParams = new URLSearchParams(window.location.search);
	const articleId = urlParams.get('article');
	if (articleId) {
		// Wait for articles to load before opening reader
		const checkInterval = setInterval(() => {
			if (allArticles.length > 0) {
				openArticleReader(articleId);
				clearInterval(checkInterval);
			}
		}, 500);
		// Stop checking after 10 seconds to prevent infinite loop
		setTimeout(() => clearInterval(checkInterval), 10000);
	}
})();

function updateNavIndicator(el) {
	const indicator = document.getElementById('nav-indicator');
	if (!indicator || !el) return;

	// Small delay to ensure layout is ready
	requestAnimationFrame(() => {
		indicator.style.width = `${el.offsetWidth}px`;
		indicator.style.left = `${el.offsetLeft}px`;
	});
}

// Modal Functions
function openGuideModal() {
	document.getElementById('guideModal').style.display = 'block';
	document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeGuideModal() {
	document.getElementById('guideModal').style.display = 'none';
	document.body.style.overflow = 'auto';
}

function openAboutModal() {
	document.getElementById('aboutModal').style.display = 'block';
	document.body.style.overflow = 'hidden';
}

function closeAboutModal() {
	document.getElementById('aboutModal').style.display = 'none';
	document.body.style.overflow = 'auto';
}



// Close modal when clicking outside of it
window.onclick = function (event) {
	const guideModal = document.getElementById('guideModal');
	const aboutModal = document.getElementById('aboutModal');

	if (event.target === guideModal) {
		closeGuideModal();
	}
	if (event.target === aboutModal) {
		closeAboutModal();
	}
}

// Close modal with Escape key
document.addEventListener('keydown', function (event) {
	if (event.key === 'Escape') {
		closeGuideModal();
		closeAboutModal();
	}
});

// ===== BOOKMARKS SYSTEM =====

// Load saved article IDs from server
async function loadSavedArticleIds() {
	try {
		const res = await fetch('bookmarks_api.php?action=get_ids');
		const data = await res.json();
		if (data.success && data.saved_ids) {
			savedArticleIds = new Set(data.saved_ids.map(String));
			updateSavedCount();
		}
	} catch (e) {
		console.error('Failed to load saved article IDs:', e);
	}
}

// Toggle bookmark on an article
async function toggleBookmark(event, articleId) {
	event.preventDefault();
	event.stopPropagation();

	if (!isLoggedIn) {
		alert('Please login to save articles.');
		return;
	}

	const btn = event.currentTarget;
	btn.classList.add('bookmark-animating');

	try {
		const formData = new FormData();
		formData.append('action', 'toggle');
		formData.append('article_id', articleId);

		const res = await fetch('bookmarks_api.php', { method: 'POST', body: formData });
		const data = await res.json();

		if (data.success) {
			if (data.saved) {
				savedArticleIds.add(String(articleId));
				btn.classList.add('saved');
				btn.innerHTML = starFilledSVG;
				btn.title = 'Remove bookmark';
			} else {
				savedArticleIds.delete(String(articleId));
				btn.classList.remove('saved');
				btn.innerHTML = starOutlineSVG;
				btn.title = 'Save for later';
			}
			updateSavedCount();
		}
	} catch (e) {
		console.error('Bookmark toggle failed:', e);
	}

	setTimeout(() => btn.classList.remove('bookmark-animating'), 400);
}

// Update saved count badge in dropdown
function updateSavedCount() {
	const badge = document.getElementById('saved-count-badge');
	if (badge) {
		const count = savedArticleIds.size;
		badge.textContent = count;
		badge.style.display = count > 0 ? 'inline-flex' : 'none';
	}
}

// Show saved articles view
async function showSavedArticles() {
	if (!isLoggedIn) {
		openAuthModal();
		return;
	}

	updateBottomNav('nav-bookmarks');

	// Disable infinite scroll for the saved view
	hasMoreArticles = false;
	const sentinel = document.getElementById('scroll-sentinel');
	if (sentinel) sentinel.remove();

	const container = document.getElementById('articles-container');
	container.innerHTML = generateSkeletonHTML(3);

	// Hide filters bar when showing saved
	const controls = document.querySelector('.controls');
	if (controls) controls.style.display = 'none';

	try {
		const res = await fetch('bookmarks_api.php?action=get_saved');
		const data = await res.json();

		if (data.success && data.articles && data.articles.length > 0) {
			// Add a header
			let headerHTML = `
				<div class="saved-articles-header">
					<div class="saved-header-left">
						<svg viewBox="0 0 24 24" width="24" height="24" fill="#f59e0b" stroke="#f59e0b" stroke-width="2"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
						<h2>Saved Articles</h2>
						<span class="saved-article-count">${data.articles.length} article${data.articles.length !== 1 ? 's' : ''}</span>
					</div>
					<button class="back-to-feed-btn" onclick="backToFeed()">
						<i class="fas fa-arrow-left"></i> Back to Feed
					</button>
				</div>
			`;

			// Render saved articles using the same card format
			const fallbackImage = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22220%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%231e293b%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20font-family%3D%22sans-serif%22%20font-size%3D%2224%22%20fill%3D%22%2394a3b8%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E';

			const savedHTML = data.articles.map((article, index) => {
				const imageUrl = article.image_url || fallbackImage;
				const category = article.category || 'general';
				const publishedDate = article.published_at ? new Date(article.published_at).toLocaleDateString('en-US', {
					year: 'numeric', month: 'short', day: 'numeric'
				}) : '';
				const savedDate = article.saved_at ? new Date(article.saved_at).toLocaleDateString('en-US', {
					year: 'numeric', month: 'short', day: 'numeric'
				}) : '';

				return `
					<article class="news-article" data-article-id="${article.article_id}" style="animation-delay: ${(index % 20) * 0.05}s">
						<div class="article-image">
							<img src="${imageUrl}" alt="${article.title}" onerror="this.onerror=null; this.src='${fallbackImage}'" loading="lazy">
							<span class="category-badge">${category}</span>
							<button class="bookmark-btn saved" data-article-id="${article.article_id}" onclick="toggleBookmark(event, ${article.article_id})" title="Remove bookmark">
								${starFilledSVG}
							</button>
						</div>
						<div class="article-content">
							<h3><a href="${article.url}" target="_blank" rel="noopener noreferrer">${article.title || 'No Title'}</a></h3>
							<div class="article-meta">
								<span class="source"><i class="fas fa-newspaper"></i> ${article.source || 'Unknown'}</span>
								<span class="date"><i class="fas fa-calendar"></i> ${publishedDate}</span>
								<span class="saved-date"><i class="fas fa-bookmark"></i> Saved ${savedDate}</span>
							</div>
							<p class="article-description">${article.content ? article.content.substring(0, 150) + '...' : 'No description available.'}</p>
							<a href="${article.url}" target="_blank" rel="noopener noreferrer" class="read-more">Read Full Article <i class="fas fa-arrow-right"></i></a>
						</div>
					</article>
				`;
			}).join('');

			container.innerHTML = headerHTML + savedHTML;
		} else {
			container.innerHTML = `
				<div class="saved-articles-header">
					<div class="saved-header-left">
						<svg viewBox="0 0 24 24" width="24" height="24" fill="#f59e0b" stroke="#f59e0b" stroke-width="2"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
						<h2>Saved Articles</h2>
					</div>
					<button class="back-to-feed-btn" onclick="backToFeed()">
						<i class="fas fa-arrow-left"></i> Back to Feed
					</button>
				</div>
				<div class="empty-saved">
					<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#64748b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
					<h3>No saved articles yet</h3>
					<p>Click the ★ star icon on any article to save it for later reading.</p>
				</div>
			`;
		}
	} catch (e) {
		console.error('Failed to load saved articles:', e);
		container.innerHTML = '<p class="no-articles">Error loading saved articles.</p>';
	}
}

// Back to news feed from saved view
function backToFeed() {
	const controls = document.querySelector('.controls');
	if (controls) controls.style.display = '';
	currentOffset = 0;
	allArticles = [];
	displayedArticles = [];
	currentFilters.type = '';
	loadNews(false);
}

// --- Personalization Features ---
async function showPersonalizedFeed(el) {
	if (!isLoggedIn) {
		openAuthModal();
		return;
	}

	if (el) {
		document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
		el.classList.add('active');
		updateNavIndicator(el);
	}
	document.getElementById('news-feed').style.display = 'block';
	const forgotEl = document.getElementById('forgot-password');
	if (forgotEl) forgotEl.style.display = 'none';

	updateBottomNav('nav-myfeed');

	currentFilters = { search: '', category: '', source: '', type: 'personalized' };

	const searchInput = document.getElementById('search-input');
	if (searchInput) searchInput.value = '';

	// Reset custom select displays
	const categoryDisplay = document.getElementById('category-display');
	if (categoryDisplay) categoryDisplay.textContent = 'All Categories';
	const categoryIcon = document.querySelector('#category-custom-select .select-icon');
	if (categoryIcon) categoryIcon.className = 'fas fa-folder select-icon';

	const sourceDisplay = document.getElementById('source-display');
	if (sourceDisplay) sourceDisplay.textContent = 'All Sources';

	loadNews(false);
}

function openPersonalizationModal() {
	if (!isLoggedIn) {
		openAuthModal();
		return;
	}

	// Fetch preferences
	fetch('preferences_api.php?action=get_preferences')
		.then(res => res.json())
		.then(data => {
			if (data.success) {
				const container = document.getElementById('personalization-categories');
				container.innerHTML = '';

				data.available_categories.forEach(cat => {
					if (!cat) return;
					const isSelected = data.saved_categories.includes(cat);

					const label = document.createElement('label');
					label.className = `category-checkbox-label ${isSelected ? 'selected' : ''}`;

					const checkbox = document.createElement('input');
					checkbox.type = 'checkbox';
					checkbox.value = cat;
					checkbox.checked = isSelected;
					checkbox.addEventListener('change', function () {
						if (this.checked) {
							label.classList.add('selected');
						} else {
							label.classList.remove('selected');
						}
					});

					label.appendChild(checkbox);

					const textSpan = document.createElement('span');
					textSpan.textContent = cat;
					label.appendChild(textSpan);

					container.appendChild(label);
				});

				document.getElementById('personalization-status').textContent = '';
				document.getElementById('personalization-modal').style.display = 'flex';
				document.body.style.overflow = 'hidden';
				setTimeout(() => document.getElementById('personalization-modal-card').classList.add('auth-modal-visible'), 10);
			}
		})
		.catch(err => console.error('Error fetching preferences:', err));
}

function closePersonalizationModal(event) {
	if (event && event.target.id !== 'personalization-modal') return;
	const card = document.getElementById('personalization-modal-card');
	if (card) card.classList.remove('auth-modal-visible');
	setTimeout(() => {
		document.getElementById('personalization-modal').style.display = 'none';
		document.body.style.overflow = '';
	}, 300);
}

function savePersonalization() {
	const container = document.getElementById('personalization-categories');
	const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
	const selectedCategories = Array.from(checkboxes).map(cb => cb.value);

	const statusEl = document.getElementById('personalization-status');
	statusEl.textContent = 'Saving...';
	statusEl.style.color = '#94a3b8';

	const formData = new FormData();
	formData.append('categories', JSON.stringify(selectedCategories));

	fetch('preferences_api.php?action=save_preferences', {
		method: 'POST',
		body: formData
	})
		.then(res => res.json())
		.then(data => {
			if (data.success) {
				statusEl.textContent = 'Preferences saved!';
				statusEl.style.color = '#68d391';
				setTimeout(() => {
					closePersonalizationModal();
					// If currently on personalized feed, reload it
					if (currentFilters.type === 'personalized') {
						loadNews(false);
					}
				}, 1000);
			} else {
				statusEl.textContent = data.error || 'Error saving preferences.';
				statusEl.style.color = '#fca5a5';
			}
		})
		.catch(err => {
			statusEl.textContent = 'Network error.';
			statusEl.style.color = '#fca5a5';
		});
}

// ===== ONBOARDING LOGIC =====
document.addEventListener('DOMContentLoaded', () => {
	const onboardingCheckboxes = document.querySelectorAll('#onboardingModal input[type="checkbox"]');
	const saveBtn = document.getElementById('btn-onboarding-save');

	if (onboardingCheckboxes && saveBtn) {
		onboardingCheckboxes.forEach(cb => {
			cb.addEventListener('change', () => {
				const checkedCount = document.querySelectorAll('#onboardingModal input[type="checkbox"]:checked').length;
				saveBtn.disabled = checkedCount < 3;
			});
		});
	}

	// Close search/filter popups on scroll or outside click
	window.addEventListener('scroll', () => {
		document.querySelectorAll('.search-dropdown').forEach(dropdown => {
			dropdown.classList.remove('show');
		});
	}, { passive: true });

	document.addEventListener('mousedown', (e) => {
		const dropdowns = document.querySelectorAll('.search-dropdown');
		dropdowns.forEach(dropdown => {
			if (dropdown.classList.contains('show')) {
				const isInside = dropdown.contains(e.target);
				const isTrigger = e.target.closest('.search-btn') || e.target.closest('.filter-main-btn');

				if (!isInside && !isTrigger) {
					dropdown.classList.remove('show');
				}
			}
		});

		// Close custom selects
		const customSelects = document.querySelectorAll('.custom-select');
		customSelects.forEach(select => {
			if (select.classList.contains('active') && !select.contains(e.target)) {
				select.classList.remove('active');
			}
		});
	});
});

// Custom Select Logic
function toggleCustomSelect(optionsId) {
	const options = document.getElementById(optionsId);
	const parent = options.closest('.custom-select');

	// Close others
	document.querySelectorAll('.custom-select').forEach(s => {
		if (s !== parent) s.classList.remove('active');
	});

	parent.classList.toggle('active');
}

function selectCustomOption(type, value, text, iconClass) {
	// Update current filters
	if (type === 'category') {
		currentFilters.category = value;
		currentFilters.type = ''; // Reset type if user selects a specific category
		document.getElementById('category-display').textContent = text;
		const triggerIcon = document.querySelector('#category-custom-select .select-icon');
		if (triggerIcon) triggerIcon.className = `fas ${iconClass} select-icon`;
	} else if (type === 'source') {
		currentFilters.source = value;
		document.getElementById('source-display').textContent = text;
	}

	// Update UI active state in options list
	const optionsId = type === 'category' ? 'category-options' : 'source-options';
	const optionsList = document.getElementById(optionsId);
	if (optionsList) {
		optionsList.querySelectorAll('.option').forEach(opt => {
			const isMatch = opt.textContent.trim() === text.trim();
			opt.classList.toggle('active', isMatch);
			opt.classList.toggle('selected', isMatch);
		});
	}

	// Close dropdown
	const parent = document.getElementById(type + '-custom-select');
	if (parent) parent.classList.remove('active');

	// Trigger filter
	filterNews();
}

function skipOnboarding() {
	document.getElementById('onboardingModal').style.display = 'none';
	document.body.style.overflow = '';
}

function saveOnboarding() {
	const checkboxes = document.querySelectorAll('#onboardingModal input[type="checkbox"]:checked');
	const selectedCategories = Array.from(checkboxes).map(cb => cb.value);

	const saveBtn = document.getElementById('btn-onboarding-save');
	saveBtn.textContent = 'Saving...';
	saveBtn.disabled = true;

	const formData = new FormData();
	formData.append('categories', JSON.stringify(selectedCategories));

	fetch('preferences_api.php?action=save_preferences', {
		method: 'POST',
		body: formData
	})
		.then(res => res.json())
		.then(data => {
			if (data.success) {
				document.getElementById('onboardingModal').style.display = 'none';
				document.body.style.overflow = '';

				// Show the home feed so the page isn't blank
				showSection('news-feed');
				currentFilters.type = '';
				currentFilters.category = '';
				currentOffset = 0;
				allArticles = [];
				displayedArticles = [];
				loadNews();

				// Show onboarding tip and pulse the My Feed link
				const myFeedLink = document.getElementById('my-feed-link');
				const tip = document.getElementById('my-feed-tip');
				if (myFeedLink && tip) {
					tip.style.display = 'flex';
					myFeedLink.classList.add('pulse-nav');
				}
				// Hide tooltip once user clicks My Feed
				myFeedLink && myFeedLink.addEventListener('click', function hideTip() {
					tip.style.display = 'none';
					myFeedLink.classList.remove('pulse-nav');
					myFeedLink.removeEventListener('click', hideTip);
				});
			} else {
				saveBtn.textContent = 'Error. Try again';
				saveBtn.disabled = false;
			}
		})
		.catch(err => {
			saveBtn.textContent = 'Network error';
			saveBtn.disabled = false;
		});
}

// Close search dropdown when clicking outside
document.addEventListener('click', (e) => {
	const searchBtn = document.querySelector('.search-btn');
	const searchDropdown = document.getElementById('search-dropdown');

	if (searchDropdown && searchBtn && searchDropdown.classList.contains('show')) {
		// Check if the click was outside both the button and the dropdown
		if (!searchBtn.contains(e.target) && !searchDropdown.contains(e.target)) {
			searchDropdown.classList.remove('show');
		}
	}
});

// Header hide/show on scroll for mobile
let lastScrollTop = 0;
const header = document.querySelector('.figma-header');

window.addEventListener('scroll', () => {
	// Only apply the effect on mobile devices (e.g. max-width: 768px)
	if (window.innerWidth > 768) {
		if (header.classList.contains('header-hidden')) {
			header.classList.remove('header-hidden');
		}
		return;
	}

	const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

	// If at the very top, always show header
	if (currentScroll <= 0) {
		header.classList.remove('header-hidden');
		lastScrollTop = 0;
		return;
	}

	// Determine scroll direction
	if (currentScroll > lastScrollTop && currentScroll > header.offsetHeight) {
		// Scrolling down -> hide header
		header.classList.add('header-hidden');
	} else if (currentScroll < lastScrollTop) {
		// Scrolling up -> show header
		header.classList.remove('header-hidden');
	}

	lastScrollTop = currentScroll;
}, { passive: true });

// ========== ARTICLE READER FUNCTIONS ==========

let lastScrollPosition = 0;

function openArticleReader(articleId) {
	const article = allArticles.find(a => String(a.article_id) === String(articleId));
	if (!article) return;

	// Store scroll position to return later
	lastScrollPosition = window.scrollY;

	// Update URL without reloading (Deep Linking)
	const newUrl = new URL(window.location);
	newUrl.searchParams.set('article', articleId);
	window.history.pushState({ path: newUrl.href }, '', newUrl.href);

	const modal = document.getElementById('article-reader');
	const image = document.getElementById('reader-image');
	const title = document.getElementById('reader-title');
	const category = document.getElementById('reader-category');
	const source = document.getElementById('reader-source');
	const date = document.getElementById('reader-date');
	const text = document.getElementById('reader-text');
	const externalLink = document.getElementById('reader-external-link');
	const sourceName = document.getElementById('reader-source-name');
	const bookmarkBtn = document.getElementById('reader-bookmark-btn');
	const shareBtn = document.getElementById('reader-share-btn');

	// Populate data
	image.src = article.image_url || 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22220%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%231e293b%22%2F%3E%3C%2Fsvg%3E';
	title.textContent = article.title || 'No Title';
	category.textContent = article.category || 'General';
	source.textContent = article.source || 'News';
	sourceName.textContent = article.source || 'Source';
	externalLink.href = article.url;

	const pubDate = article.published_at ? new Date(article.published_at).toLocaleDateString('en-US', {
		year: 'numeric', month: 'long', day: 'numeric'
	}) : 'Recent';
	date.textContent = pubDate;

	// Content: Use content field if available, fallback to description
	text.innerHTML = article.content || article.description || 'No content available for this article.';

	// Bookmark status in reader
	const isSaved = savedArticleIds.has(String(articleId));
	bookmarkBtn.className = `reader-action-btn ${isSaved ? 'saved' : ''}`;
	bookmarkBtn.innerHTML = isSaved ? starFilledSVG : starOutlineSVG;
	bookmarkBtn.onclick = (e) => {
		toggleBookmark(e, articleId);
		// Toggle UI immediately in reader too
		setTimeout(() => {
			const nowSaved = savedArticleIds.has(String(articleId));
			bookmarkBtn.className = `reader-action-btn ${nowSaved ? 'saved' : ''}`;
			bookmarkBtn.innerHTML = nowSaved ? starFilledSVG : starOutlineSVG;
		}, 100);
	};

	// Share button: Share THIS page's link with article ID
	shareBtn.onclick = () => {
		const shareUrl = window.location.href; // This now includes ?article=ID
		const shareTitle = `Read on NewsAggregator: ${article.title}`;

		if (navigator.share) {
			navigator.share({
				title: shareTitle,
				url: shareUrl
			}).catch(console.error);
		} else {
			// Fallback: Copy to clipboard
			const el = document.createElement('textarea');
			el.value = shareUrl;
			document.body.appendChild(el);
			el.select();
			document.execCommand('copy');
			document.body.removeChild(el);
			showToast('Link copied to clipboard!', 'info');
		}
	};

	// Show modal
	modal.style.display = 'block';
	setTimeout(() => {
		modal.classList.add('active');
		document.body.style.overflow = 'hidden';
	}, 10);
}

function closeArticleReader() {
	const modal = document.getElementById('article-reader');
	modal.classList.remove('active');

	// Reset URL (remove article param)
	const newUrl = new URL(window.location);
	newUrl.searchParams.delete('article');
	window.history.pushState({ path: newUrl.href }, '', newUrl.href);

	setTimeout(() => {
		modal.style.display = 'none';
		document.body.style.overflow = 'auto';
		// Return to last scroll position
		window.scrollTo(0, lastScrollPosition);
	}, 300);
}

// ========== SUPPORT TICKETS FUNCTION ==========

async function submitSupportTicket(event, type) {
    event.preventDefault();
    
    const nameInput = document.getElementById(`${type}-name`);
    const messageInput = document.getElementById(`${type}-message`);
    const statusSpan = document.getElementById(`${type}-status`);
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    const name = nameInput.value.trim();
    const message = messageInput.value.trim();
    
    if (!name || !message) {
        statusSpan.textContent = 'Please fill out all fields.';
        statusSpan.style.color = '#ef4444';
        return;
    }
    
    // Disable button and show loading state
    const originalBtnHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;
    statusSpan.textContent = '';
    
    try {
        const response = await fetch('submit_ticket.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ type, name, message })
        });
        
        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('Non-JSON response:', responseText);
            statusSpan.textContent = 'Server error: Received invalid response. Please check if submit_ticket.php exists.';
            statusSpan.style.color = '#ef4444';
            return;
        }
        
        if (data.success) {
            statusSpan.textContent = 'Your message has been sent successfully. We will review it shortly.';
            statusSpan.style.color = '#22c55e'; // Green
            nameInput.value = '';
            messageInput.value = '';
        } else {
            statusSpan.textContent = data.error || 'An error occurred while sending your message.';
            statusSpan.style.color = '#ef4444'; // Red
        }
    } catch (error) {
        console.error('Fetch error:', error);
        statusSpan.textContent = 'Connection error. Please check your internet or if the server is reachable.';
        statusSpan.style.color = '#ef4444';
    } finally {
        submitBtn.innerHTML = originalBtnHTML;
        submitBtn.disabled = false;
    }
}
