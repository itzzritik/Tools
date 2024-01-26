import puppeteer from 'puppeteer';

export const launchBrowser = async () => {
	if (process.env.NODE_ENV === 'production') {
		return await puppeteer.connect({
			browserWSEndpoint: `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_TOKEN}`,
			defaultViewport: { width: 1920, height: 1080 },
		});
	}

	return await puppeteer.launch({ headless: false, defaultViewport: { width: 1920, height: 1080 } });
};
