import { Request, Response } from 'express';

const express = require('express');
const cors = require('cors')

const app = express();

export function server()
{
	app.use(express.json());
	app.use(cors())

	const s = app.listen(3000, () => {
		console.log('Express server listening on port ' + s.address().port);
	});

	app.get('/', (req: Request, res: Response) => {
		res.send({ message: 'Hello world! Lala Seth is here!'});
	});
}

export const Server = app;

