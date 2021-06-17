import { Request, Response } from 'express';

import { DBClient } from '../../../middlewares/prisma-client';
import { authenticated, Claims } from '../../../middlewares/auth-check';

const prismaClient = DBClient.getInstance();

export default async (req: Request, res: Response) => {
	if(req.method !== 'GET')
		return 	res.status(401).json({ message: 'Not authorized!'});

	const projects = await prismaClient.prisma.project.findMany({
		where: {
			id: '1',
		},
	});

	res.status(200).json(projects);
};
