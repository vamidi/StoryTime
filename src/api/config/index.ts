import { Request, Response } from 'express';
import { compare } from 'bcrypt';
import atob from 'atob';

export default async (req: Request, res: Response) =>
{
	if(req.method !== 'POST') return res.status(401).json({ errorMessage: 'Not authorized!'});

	const response: { secret } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

	const comparedResult = await compare(`${response.secret}${process.env.APP_SALT}`, atob(process.env.APP_SECRET));
	if (comparedResult) {
		// make JWT token
		res.status(200).json(response);
	}

	return res.status(401).json({ errorMessage: 'Not authorized '});

}
