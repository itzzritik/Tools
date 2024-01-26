const options: Intl.DateTimeFormatOptions = {
	timeZone: 'Asia/Kolkata',
	year: 'numeric',
	month: 'long',
	day: 'numeric',
	hour: 'numeric',
	minute: 'numeric',
	second: 'numeric',
};

const generateMarkdown = (title: string, logs: string[]) => `
*${title}*

\`\`\`
${logs.join('\n')}
\`\`\`

\`${new Intl.DateTimeFormat('en-IN', options).format(new Date())}\`
\`Environment: ${process.env.NODE_ENV}\`
`;

export const sendToTelegram = async (title: string, logs: string[], button?: {text: string, url: string}) => {
	const apiUrl = `https://api.telegram.org/bot${process.env.JARVIS_BOT_TOKEN}/sendMessage`;
	const res = await fetch(apiUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			chat_id: process.env.TELEGRAM_CHAT_ID,
			text: generateMarkdown(title, logs),
			...(button ? { reply_markup: JSON.stringify({
				inline_keyboard: [[button]],
			}) } : {}),
			parse_mode: 'MarkdownV2',
		}),
	});
	await res.json();
};
