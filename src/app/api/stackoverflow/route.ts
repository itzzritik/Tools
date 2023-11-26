import { NextResponse } from 'next/server';
import { Browser } from 'puppeteer';

import { CatchNextResponse, getBrowser } from '#utils/helper/helper';
import { sendToTelegram } from '#utils/helper/sendMessage';

let logs: Array<string> = [];

const login = async (browser: Browser) => {
	const loginPage = await browser.newPage();
	await loginPage.setViewport({ width: 1920, height: 1080 });
	await loginPage.goto('https://stackoverflow.com/users/login');
	logs.push('		◦ Launched login page');
	await loginPage.waitForSelector('#password', { timeout: 6000 });
	await loginPage.type('#email', process.env.STACK_OVERFLOW_EMAIL ?? '');
	await loginPage.type('#password', process.env.STACK_OVERFLOW_PASSWORD ?? '');

	await (await loginPage.$('#password'))?.press('Enter');
	logs.push('		◦ Logging in');
	await loginPage.waitForNavigation();
};

const checkSession = async (browser: Browser) => {
	const settingsPage = await browser.newPage();
	await settingsPage.setViewport({ width: 1920, height: 1080 });
	await settingsPage.goto('https://stackoverflow.com/users/preferences');
	logs.push('		◦ Launched profile page');
	await settingsPage.waitForSelector('#mainbar-full', { timeout: 6000 });
	logs.push('		◦ Profile page worked, (Session Exists)');
};

const openRandomQuestion = async (browser: Browser) => {
	const questionPage = await browser.newPage();
	await questionPage.setViewport({ width: 1920, height: 1080 });
	await questionPage.goto('https://stackoverflow.com/questions');
	logs.push('		◦ Launched questions page');
	const questionWrapper = await questionPage.$('#questions');
	const questionList = (await questionWrapper?.$$('.s-post-summary > div.s-post-summary--content > h3 > a'))?.slice(0, 10);
	const randomQuestion = questionList?.[Math.floor(Math.random() * questionList?.length)];

	await randomQuestion?.click();
	logs.push('		◦ Random question clicked');
	await questionPage.waitForNavigation({ timeout: 6000 });
	logs.push('		◦ Question paged opened');
};

export async function GET () {
	try {
		logs = [];

		logs.push('• Launching browser');
		const browser = await getBrowser();
		logs.push('		◦ Launched successfully');

		try {
			logs.push('• Logging to Stackoverflow');
			await login(browser);
		} catch (error) {
			logs.push('		◦ Error: Failed to login, session already exist');
		}

		try {
			logs.push('• Checking Stackoverflow session');
			await checkSession(browser);
		} catch (err) {
			logs.push('		◦ Error: ' + err.message);
		}

		try {
			logs.push('• Open random stackoverflow question');
			await openRandomQuestion(browser);
		} catch (err) {
			logs.push('		◦ Error: ' + err.message);
		}

		await browser.close();
		logs.push('• Browser closed');

		await sendToTelegram('Stackoverflow Session Triggered', logs);
		return new NextResponse(['Stackoverflow Session Triggered\n', ...logs].map((v) => v.replaceAll('\t\t', '\t')).join('\n'));
	} catch (err) {
		return CatchNextResponse(err);
	}
}

export const revalidate = 0;
