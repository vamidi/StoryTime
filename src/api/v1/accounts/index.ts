import { Request, Response } from 'express';
import cors from '../../middlewares/cors';

export default async (req: Request, res: Response) =>
{
	// Run cors
	await cors(req, res);

	console.log(req, res);

	return res.status(200).json({ message : 'Ok'});
}
