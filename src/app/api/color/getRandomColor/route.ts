import { random, extend } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';
import { NextResponse } from 'next/server';

import { CatchNextResponse } from '#utils/helper/helper';

extend([a11yPlugin]);

const generateRandomColor = (style: string, brightness: number) => {
	let color = random();
	if (style === 'bright') {
		while (color.luminance() < brightness) {
			color = random();
		}
	}
	return color;
};

export async function GET (req: Request) {
	try {
		const type = new URL(req.url).searchParams.get('type') ?? 'hex';
		const style = new URL(req.url).searchParams.get('style') ?? 'any';
		const brightness = parseFloat(new URL(req.url).searchParams.get('brightness') ?? '0.7');

		if (!colorType.includes(type)) throw { status: 400, message: 'Invalid Color Type' };
		if (!colorStyle.includes(style)) throw { status: 400, message: 'Invalid Color Style' };

		const color = generateRandomColor(style, brightness);

		if (type === 'hex') return new NextResponse(color.toHex());
		if (type === 'rgb') return NextResponse.json(color.toRgb());
		if (type === 'hsl') return NextResponse.json(color.toHsl());
		if (type === 'hsv') return NextResponse.json(color.toHsv());

		throw { status: 500, message: 'Something went wrong' };
	} catch (err) {
		return CatchNextResponse(err);
	}
}

const colorType = ['hex', 'rgb', 'hsl', 'hsv'];
const colorStyle = ['any', 'bright'];
