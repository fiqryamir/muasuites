// Cheap bot triage for the request hook.
// Matches ONLY rude/non-compliant scrapers and core scanner junk paths.
// Never matches AI crawlers, search engines, mobile browsers, or in-app WebViews —
// those stay allowed (AI + search visibility is a feature; see decision 05).

// Non-compliant scraper toolkits that ignore robots.txt / hammer-scan.
// Deliberately excludes GPTBot/ClaudeBot/CCBot/Bytespider/PerplexityBot/OAI-SearchBot,
// googlebot, bingbot, mobile browsers and in-app WebViews.
const RUDE_SCRAPER_UA_BLOCKS = [
	'python-requests',
	'python-urllib',
	'libwww-perl',
	'scrapy',
	'go-http-client',
	'wget'
];

// Core scanner junk paths -> instant 404. Matched on pathname only (query strings
// are stripped by URL.pathname), anchored so /api/... segments can't false-positive.
const SCANNER_PATH_PATTERNS = [
	/\.(?:php|asp|aspx)(?:[/?]|$)/,
	/(?:^|\/)\.env(?:$|[./?])/,
	/(?:^|\/)\.git(?:[/?]|$)/,
	/(?:^|\/)wp-/,
	/(?:^|\/)xmlrpc\.php(?:[/?]|$)/,
	/(?:^|\/)config\.(?:php|json|js|xml|yml|yaml|ini|env|bak|old|txt)(?:[/?]|$)/
];

export function isRudeScraper(userAgent: string): boolean {
	const ua = userAgent.toLowerCase();
	return RUDE_SCRAPER_UA_BLOCKS.some((token) => ua.includes(token));
}

export function isScannerPath(pathname: string): boolean {
	return SCANNER_PATH_PATTERNS.some((pattern) => pattern.test(pathname));
}
