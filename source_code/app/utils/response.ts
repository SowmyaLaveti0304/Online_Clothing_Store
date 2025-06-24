import { json } from "@remix-run/node";

export const badRequest = <T = any>(data: T) => json<T>(data, { status: 400 });
export const unauthorized = <T = any>(data: T) =>
	json<T>(data, { status: 401 });
export const forbidden = <T = any>(data: T) => json<T>(data, { status: 403 });
export const notFound = <T = any>(data: T) => json<T>(data, { status: 404 });
export const invalid = <T = any>(data: T) => json<T>(data, { status: 405 });
