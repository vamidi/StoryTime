import { Request, Response } from 'express';
import { AddressInfo } from 'net';
import * as http from 'http';

const express = require('express');
const cors = require('cors')

const app = express();
let server: http.Server = null;
let hasStarted = false;

export function startServer()
{
	if(hasStarted)
		return;

	app.use(express.json());
	app.use(cors())

	server = app.listen(3000, () => {
		hasStarted = true;
		console.log('Express server listening on port ' + (server.address() as AddressInfo).port);
	});

	app.get('/', (req: Request, res: Response) => {
		res.send({ message: 'Hello world! Lala Seth is here!'});
	});
}

export function closeServer()
{
	if(server)
		server.close(() => hasStarted = false);
}

export const Server = app;

