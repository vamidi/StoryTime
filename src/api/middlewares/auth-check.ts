import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import cors from './cors';
/**
 * Enumeration of supported providers.
 *
 * @public
 */
export enum ProviderId {
	/** @internal */
	ANONYMOUS = 'anonymous',
	/** @internal */
	CUSTOM = 'custom',
	/** Facebook provider ID */
	FACEBOOK = 'facebook.com',
	/** @internal */
	FIREBASE = 'firebase',
	/** GitHub provider ID */
	GITHUB = 'github.com',
	/** Google provider ID */
	GOOGLE = 'google.com',
	/** Password provider */
	PASSWORD = 'password',
	/** Phone provider */
	PHONE = 'phone',
	/** Twitter provider ID */
	TWITTER = 'twitter.com',
}

export interface Claims {
	name: string,
	picture: string,
	iss: string,
	aud: string,
	auth_time: number,
	uid: string,
	user_id: string,
	sub: string,
	email: string,
	email_verified: boolean,
	prisma: {
		identities: {
			email: string[],
		},
		sign_in_provider: ProviderId,
	}
}

export const authenticatedMiddleware = () => async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {

	// Run cors
	await cors(req, res);

	return verify(req.headers.authorization!, process.env.JWT_SECRET,function (err, decoded)
	{
		if (!err && decoded) {
			res.locals.payload = decoded as Claims;
			return next();
		}

		res.status(401).json({ errorMessage: 'Sorry you are not authenticated' });
	});
}
