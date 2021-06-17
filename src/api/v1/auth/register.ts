import { Request, Response } from 'express';
import { hash as Encrypt } from 'bcrypt';

import { DBClient } from '../../middlewares/prisma-client';

const prismaClient = DBClient.getInstance();

export default async (req: Request, res: Response) =>
{
	if(req.method !== 'POST')
		return 	res.status(401).json({ errorMessage: 'Not authorized!'});

	const hash = await Encrypt(req.body.password, 10);

	const response = await prismaClient.prisma.user.create({
		data: {
			metadata: {
				create:
				{
					updated_at: new Date(Date.now()),
					displayName: `${req.body.firstName} ${req.body.lastName}`,
					email: req.body.email,
					password: hash,
					firstName: req.body.firstName,
					lastName: req.body.lastName,
					photoURL: '',
				},
			},
		},
	});

	// make JWT token
	res.status(200).json(response);
}
