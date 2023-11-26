declare global {
	interface NextResponseError {
		status: number;
		message: string;
	}
}
