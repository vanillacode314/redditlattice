module.exports = {
	globDirectory: '.output/public',
	globPatterns: [
		'**/*.{mjs,css,ttf,svg,eot,woff,woff2,html,png,json}'
	],
	swDest: '.output/public/sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
};