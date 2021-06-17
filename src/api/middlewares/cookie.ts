/*
 * Options used in resolvers to issue the refresh token cookie.
 */
import { Request, Response, NextFunction } from 'express';
import { Token, User } from '@prisma/client';
import { compareSync, genSalt, hash } from 'bcrypt';
import { v4 as uuidV4 } from 'uuid';
import cookie, { CookieSerializeOptions } from 'cookie';

import { DBClient } from './prisma-client';

const prismaClient = DBClient.getInstance();

const REFRESH_TOKEN_COOKIE_OPTIONS: CookieSerializeOptions = {
	// Get part after // and before : (in case port number in URL)
	// E.g. <http://localhost:3000> becomes localhost
	domain: process.env.BASE_URL.split('//')[1].split(':')[0],
	httpOnly: true,
	path: '/',
	sameSite: 'strict',
	// Allow non-secure cookies only in development environment without HTTPS
	secure: !!process.env.BASE_URL.includes('https'),
};

export const setCookie = async (res: Response, jwt: string) => {
	// Set the payload in the cookie.
	res.setHeader('Set-Cookie', cookie.serialize('auth', jwt, REFRESH_TOKEN_COOKIE_OPTIONS));
}

/**
 * Find tokens from a user. and sees if the token given is expired
 * @param userId
 * @param refreshToken
 * @return Token[]
 */
export const findTokens = async (userId: string, refreshToken: string) =>
{
	let isRefreshTokenValid = false;
	const tokens: Token[] = await prismaClient.prisma.token.findMany({
		where: {
			userId: userId,
		},
	});

	const filteredTokens = tokens.filter(
		(storedToken) => {
			const isMatch = compareSync(refreshToken, storedToken.hash);
			const isValid = storedToken.expiration.getTime() > Date.now();
			if (isMatch && isValid) {
				isRefreshTokenValid = true;
			}
			return !isMatch && isValid;
		},
	);

	return isRefreshTokenValid;
}

/**
 * Create cookie
 */
export const createCookie = async () => {
	const newRefreshToken = uuidV4();
	const newRefreshTokenExpiry = new Date(
		Date.now() + parseInt(process.env.REFRESH_TOKEN_EXPIRY) * 1000,
	);
	const salt = await genSalt(10);
	const newRefreshTokenHash = await hash(newRefreshToken, salt);

	return { newRefreshToken, newRefreshTokenExpiry, newRefreshTokenHash };
}

export const insertToken = async (userId: string, newRefreshTokenHash: string, newRefreshTokenExpiry: Date) =>
{
	// first create the token in the database then connect it to the user.
	const now = new Date(Date.now());
	const newToken = await prismaClient.prisma.token.create({
		data: {
			updated_at: now,
			type: 'API',
			hash: newRefreshTokenHash,
			valid: true,
			expiration: newRefreshTokenExpiry,
			userId: userId,
		},
	});


	await prismaClient.prisma.user.update({
		where: {
			id: userId,
		},
		data: {
			tokens: {
				connect: {
					id: newToken.id,
				},
			},
		},
	});
}

export const updateToken = async (token: Token, newRefreshTokenExpiry: Date) => {
	// first create the token in the database then connect it to the user.
	const now = new Date(Date.now());
	await prismaClient.prisma.token.update({
		where: {
			id: token.id,
		},
		data: {
			updated_at: now,
			expiration: newRefreshTokenExpiry,
		},
	});
}


/**
 * Check if the token exist in the DB and if it is still valid.
 * @param user
 * @param refreshToken
 */
export const checkToken = async (user: User, refreshToken: string) =>
{
	let isRefreshTokenValid = false, isMatch = false, isValid = false;

	const tokens: Token[] = await prismaClient.prisma.token.findMany({
		where: {
			userId: user.id,
		},
	});

	const filteredTokens: Token[] = tokens.filter(
		(storedToken) => {
			isMatch = compareSync(refreshToken, storedToken.hash);
			isValid = storedToken.expiration.getTime() > Date.now();
			if (isMatch && isValid) {
				isRefreshTokenValid = true;
			}
			return !isMatch && isValid;
		});


	return { token: filteredTokens.length > 0 ? filteredTokens[filteredTokens.length - 1] : null, isMatch, isValid };
}

/**
 * Check if cookie exists
 * @param user
 */
export const checkCookie = (user: User) => async (
	req: Request,
	res: Response,
	next: NextFunction,
) =>
{
	const setCookies = [];

	const { refreshToken } = req.cookies;
	if (!refreshToken) res.status(401).json({ message: 'No refresh token provided'});

	if (user === null) res.status(401).json({ message: 'Invalid user' });

	let isRefreshTokenValid = await findTokens(user.id, refreshToken);

	if (!isRefreshTokenValid) throw new Error('Invalid refresh token');

	const { newRefreshToken, newRefreshTokenExpiry, newRefreshTokenHash } = await createCookie();

	setCookies.push({
		name: 'refreshToken',
		value: newRefreshToken,
		options: {
			...REFRESH_TOKEN_COOKIE_OPTIONS,
			expires: newRefreshTokenExpiry,
		},
	});

	await insertToken(user.id, newRefreshTokenHash, newRefreshTokenExpiry);
	return next();
};


