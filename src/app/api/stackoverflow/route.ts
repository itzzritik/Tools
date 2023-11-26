import { NextResponse } from 'next/server';
import { Browser } from 'puppeteer';

import { CatchNextResponse, getBrowser } from '#utils/helper/helper';
import { sendToTelegram } from '#utils/helper/sendMessage';

let session = false;
let error: TError;

const login = async (browser: Browser) => {
	const loginPage = await browser.newPage();
	await loginPage.setViewport({ width: 1920, height: 1080 });
	await loginPage.goto('https://stackoverflow.com/users/login');
	await loginPage.waitForSelector('#password', { timeout: 2000 });
	await loginPage.type('#email', process.env.STACK_OVERFLOW_EMAIL ?? '');
	await loginPage.type('#password', process.env.STACK_OVERFLOW_PASSWORD ?? '');

	await (await loginPage.$('#password'))?.press('Enter');
	await loginPage.waitForNavigation();
};

const checkSession = async (browser: Browser) => {
	const settingsPage = await browser.newPage();
	await settingsPage.setViewport({ width: 1920, height: 1080 });
	await settingsPage.goto('https://stackoverflow.com/users/preferences');
	await settingsPage.waitForSelector('#mainbar-full', { timeout: 2000 });
};

const openRandomQuestion = async (browser: Browser) => {
	const questionPage = await browser.newPage();
	await questionPage.setViewport({ width: 1920, height: 1080 });
	await questionPage.goto('https://stackoverflow.com/questions');
	const questionWrapper = await questionPage.$('#questions');
	const questionList = (await questionWrapper?.$$('.s-post-summary > div.s-post-summary--content > h3 > a'))?.slice(0, 10);
	const randomQuestion = questionList?.[Math.floor(Math.random() * questionList?.length)];

	await randomQuestion?.click();
	await questionPage.waitForNavigation({ timeout: 2000 });
};

export async function GET () {
	try {
		session = false;
		error = undefined as unknown as TError;

		await sendToTelegram('[Started] Stack overflow session triggered');
		const browser = await getBrowser();

		try {
			await login(browser);
		} catch (error) {
			session = true;
			console.log('Login: Already logged in');
		}

		try {
			await checkSession(browser);
		} catch (err) {
			if (!error) error = {} as TError;
			error.session = err.message;
			await sendToTelegram(`Error: ${err.message}`);
			console.log(`CheckSession: ${err.message}`);
		}

		try {
			await openRandomQuestion(browser);
		} catch (err) {
			if (!error) error = {} as TError;
			error.question = err.message;
			await sendToTelegram(`Error: ${err.message}`);
			console.log(`OpenRandomQuestion: ${err.message}`);
		}

		const report = `[Completed${error ? ' (Error)' : ''}${session ? ' (Pre-LoggedIn)' : ''}] Stack overflow session`;

		await sendToTelegram(report);
		await browser.close();

		if (error) return NextResponse.json({ status: 500, ...error });

		return NextResponse.json({ status: 200, message: report });
	} catch (err) {
		console.log(err);
		return CatchNextResponse(err);
	}
}

type TError = {session: string, question: string}
