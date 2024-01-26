import { NextResponse } from 'next/server';
import { Page } from 'puppeteer';

import { launchBrowser } from '#utils/helper/browser';
import { sendToTelegram } from '#utils/helper/sendMessage';

const title = 'Stackoverflow Session Triggered';
const button = { text: 'Failed, Trigger Manually', url: 'https://stackoverflow.com' };
let error = false;
let logs: string[] = [];

const login = async (page: Page) => {
	await page.goto('https://stackoverflow.com/users/login');
	logger('		◦ Launched login page');
	await page.waitForSelector('#onetrust-accept-btn-handler', { timeout: 6000 });
	const acceptCookies = await page.$('#onetrust-accept-btn-handler');
	await acceptCookies?.click();

	await page.type('#email', process.env.STACK_OVERFLOW_EMAIL ?? '', { delay: 10 });
	await page.type('#password', process.env.STACK_OVERFLOW_PASSWORD ?? '', { delay: 10 });

	const submitButton = await page.$('#submit-button');
	await submitButton?.click();
	logger('		◦ Logging in');

	await page.waitForNavigation();
	logger('		◦ Login complete');
};

const checkSession = async (page: Page) => {
	await page.goto('https://stackoverflow.com');
	logger('		◦ Launched stackoverflow home page');

	const profileIcon = await page.$('header > div > nav > ol > li:nth-child(2) > a');

	if (profileIcon) {
		await profileIcon?.click();
		logger('		◦ Clicked profile icon');
	}

	await page.waitForSelector('#mainbar-full', { timeout: 12000 });
	logger('		◦ Profile page worked, (Session Exists)');

	const streakElement = await page.$('.wmx2 div span');
	if (streakElement) {
		const streak = await page.evaluate((elem) => elem.textContent, streakElement);
		logger('		◦ Current streak: ' + streak);
	}
};

const openRandomQuestion = async (page: Page) => {
	await page.goto('https://stackoverflow.com/questions');
	logger('		◦ Launched questions page');
	const questionWrapper = await page.$('#questions');
	const questionList = (await questionWrapper?.$$('.s-post-summary > div.s-post-summary--content > h3 > a'))?.slice(0, 10);
	const randomQuestion = questionList?.[Math.floor(Math.random() * questionList?.length)];

	await randomQuestion?.click();
	logger('		◦ Random question clicked');
	await page.waitForNavigation({ timeout: 6000 });
	logger('		◦ Question paged opened');
};

const logger = (message: string) => {
	logs.push(message);
	console.log(message.replaceAll('\t\t', '    '));
};

export async function GET () {
	try {
		const startTime = performance.now();
		console.log(`${title} (${process.env.NODE_ENV})` + '\n');
		logs = [];

		logger('• Launching browser');
		const browser = await launchBrowser();
		logger('		◦ Launched successfully');

		const page = await browser.newPage();
		await page.setViewport({ width: 1920, height: 1080 });

		try {
			logger('• Logging to Stackoverflow');
			await login(page);
		} catch (err) {
			error = true;
			logger('		◦ Error: Failed to login, session already exist');
		}

		try {
			logger('• Checking Stackoverflow session');
			await checkSession(page);
		} catch (err) {
			error = true;
			logger('		◦ Error: ' + err.message);
		}

		try {
			logger('• Open random stackoverflow question');
			await openRandomQuestion(page);
		} catch (err) {
			error = true;
			logger('		◦ Error: ' + err.message);
		}

		await browser.close();
		logger('• Browser closed');
		logger(`\n• Elapsed Time: ${Math.round(((performance.now() - startTime) / 1000) * 100) / 100} seconds`);

		await sendToTelegram(title, logs, error ? button : undefined);
		return new NextResponse(['Stackoverflow Session Triggered\n', ...logs]
			.map((v) => v.replaceAll('\t\t', '\t')).join('\n'));
	}
	catch (err) {
		console.log(err);
	}
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 10;
