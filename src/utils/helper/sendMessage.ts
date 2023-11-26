const options = {
	timeZone: 'Asia/Kolkata',
	year: 'numeric',
	month: 'long',
	day: 'numeric',
	hour: 'numeric',
	minute: 'numeric',
	second: 'numeric',
} as const;

export const sendToTelegram = async (message: string) => {
	const currentDateIST = new Intl.DateTimeFormat('en-IN', options).format(new Date());
	const url = `https://api.callmebot.com/text.php?user=ItzzRitik&text=${
		encodeURIComponent(message) + ', on: ' + encodeURIComponent(currentDateIST)
	}`;
	await fetch(url);
};
