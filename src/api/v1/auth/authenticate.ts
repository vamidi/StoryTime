import { Request, Response } from 'express';
import { compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import { DBClient } from '../../middlewares/prisma-client';
import { createCookie, insertToken } from '../../middlewares/cookie';
import cors from '../../middlewares/cors';
import { makeClaims } from '../../middlewares/claims';

const prismaClient = DBClient.getInstance();

export default async (req: Request, res: Response) =>
{
	// Run cors
	await cors(req, res);

	if (req.method !== 'POST')
		return res.status(401).json({ errorMessage: 'Not authorized!' });

	// password: hash,
	const response: { email, password } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

	if(response)
	{
		const userMetadata = await prismaClient.prisma.userMetaData.findFirst({
			where: {
				email: response.email,
			},
		});

		if(!response.password || !userMetadata.password)
			return res.status(200).json({ errorMessage: 'User could not be found'});

		const comparedResult = await compare(response.password, userMetadata.password);
		if (comparedResult)
		{
			// delete the password from the response
			// delete userMetadata.password;

			// make JWT token
			const claims = await makeClaims(userMetadata);
			const token = sign(claims, process.env.JWT_SECRET, { expiresIn: parseInt(process.env.JWT_EXPIRY) });
			const { newRefreshToken, newRefreshTokenExpiry, newRefreshTokenHash } = await createCookie();
			await insertToken(userMetadata.userId, newRefreshTokenHash, newRefreshTokenExpiry);
			return res.status(200).json({ idToken: token, refreshToken: newRefreshToken });
		}

		return res.status(200).json({ errorMessage: 'User could not be found'});
	}

	return res.status(401).json({ errorMessage: 'User could not be found'});
}
