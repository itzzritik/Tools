import { NextResponse } from 'next/server';
import puppeteer, { Browser } from 'puppeteer';

import { sendToTelegram } from '#utils/helper/sendMessage';

const title = 'Stackoverflow Session Triggered';
const button = { text: 'Failed, Trigger Manually', url: 'https://stackoverflow.com' };
let error = false;
let logs: string[] = [];

const login = async (browser: Browser) => {
	const loginPage = await browser.newPage();
	await loginPage.setViewport({ width: 1920, height: 1080 });
	await loginPage.goto('https://stackoverflow.com/users/login');
	logger('		◦ Launched login page');
	await loginPage.waitForSelector('#password', { timeout: 6000 });
	await loginPage.type('#email', process.env.STACK_OVERFLOW_EMAIL ?? '');
	await loginPage.type('#password', process.env.STACK_OVERFLOW_PASSWORD ?? '');

	const submitButton = await loginPage.$('#submit-button');
	await submitButton?.click();
	logger('		◦ Logging in');

	await loginPage.waitForNavigation();
	await loginPage.close();
	logger('		◦ Login complete');
};

const checkSession = async (browser: Browser) => {
	logger('		◦ Launching new browser tab');
	const profilePage = await browser.newPage();
	logger('		◦ Setting viewport size');
	await profilePage.setViewport({ width: 1920, height: 1080 });
	logger('		◦ Launching stackoverflow home page');
	await profilePage.goto('https://stackoverflow.com');
	logger('		◦ Launched stackoverflow home page');

	const profileIcon = await profilePage.$('header > div > nav > ol > li:nth-child(2) > a');

	if (profileIcon) {
		await profileIcon?.click();
		logger('		◦ Clicked profile icon');
	}

	await profilePage.waitForSelector('#mainbar-full', { timeout: 12000 });
	logger('		◦ Profile page worked, (Session Exists)');

	const streakElement = await profilePage.$('.wmx2 div span');
	if (streakElement) {
		const streak = await profilePage.evaluate((elem) => elem.textContent, streakElement);
		logger('		◦ Current streak: ' + streak);
	}
};

const openRandomQuestion = async (browser: Browser) => {
	const questionPage = await browser.newPage();
	await questionPage.setViewport({ width: 1920, height: 1080 });
	await questionPage.goto('https://stackoverflow.com/questions');
	logger('		◦ Launched questions page');
	const questionWrapper = await questionPage.$('#questions');
	const questionList = (await questionWrapper?.$$('.s-post-summary > div.s-post-summary--content > h3 > a'))?.slice(0, 10);
	const randomQuestion = questionList?.[Math.floor(Math.random() * questionList?.length)];

	await randomQuestion?.click();
	logger('		◦ Random question clicked');
	await questionPage.waitForNavigation({ timeout: 6000 });
	logger('		◦ Question paged opened');
};

const logger = (message: string) => {
	logs.push(message);
	console.log(message.replaceAll('\t\t', '    '));
};

export async function GET () {
	try {
		const startTime = performance.now();
		console.log(title + '\n');
		logs = [];

		logger('• Launching browser');
		const browser = await puppeteer.connect({ browserWSEndpoint: `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_TOKEN}` });
		logger('		◦ Launched successfully');

		try {
			logger('• Logging to Stackoverflow');
			await login(browser);
		} catch (err) {
			error = true;
			logger('		◦ Error: Failed to login, session already exist');
		}

		try {
			logger('• Checking Stackoverflow session');
			await checkSession(browser);
		} catch (err) {
			error = true;
			logger('		◦ Error: ' + err.message);
		}

		try {
			logger('• Open random stackoverflow question');
			await openRandomQuestion(browser);
		} catch (err) {
			error = true;
			logger('		◦ Error: ' + err.message);
		}

		await browser.close();
		logger('• Browser closed');
		logger(`\n• Elapsed Time: ${Math.round(((performance.now() - startTime) / 1000) * 100) / 100} seconds`);

		await sendToTelegram(title, logs, error ? button : undefined);
		return new NextResponse(['Stackoverflow Session Triggered\n', ...logs].map((v) => v.replaceAll('\t\t', '\t')).join('\n'));
	}
	catch (err) {
		console.log(err);
	}
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 10;
