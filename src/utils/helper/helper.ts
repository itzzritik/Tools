import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export const CatchNextResponse = ({ message = 'Something went wrong', status = 500 }: NextResponseError) => {
	return NextResponse.json(
		{ message, status },
		{ status },
	);
};

export const getBrowser = () => (process.env.NODE_ENV === 'production'
	? puppeteer.connect({ browserWSEndpoint: `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_TOKEN}` })
	: puppeteer.launch({
		headless: false,
		args: ['--disable-notifications', '--no-sandbox', '--start-maximized'],
	})
);
