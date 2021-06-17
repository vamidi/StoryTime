import { Server } from '../server';

import { authenticatedMiddleware } from '../middlewares/auth-check';
import { Authenticate, Register } from './auth';

/** ------- API -------- */

Server.use('/api/v1', authenticatedMiddleware);

/** ----- USER Authentication ---- */

Server.post('/api/v1/auth/authenticate', Authenticate);
Server.post('/api/v1/auth/register', Register);

Server.get('me', () => {});

Server.get('refresh', () => {});

const express = require('express');
const router = express.Router();

/**
 * Route path: /users/:userId/books/:bookId
 * Request URL: http://localhost:3000/users/34/books/8989
 * req.params: { "userId": "34", "bookId": "8989" }
 * get the params => req.params
 */
router.get('/', () => {});
// Get all projects of the user
router.get('/projects/', () => {});
// Get one of the projects for the user
router.get('/projects/:project', () => {});
// Get the tables of the selected project
router.get('/projects/:project/tables/', () => {});
// Get a table inside the project of the user.
router.get('/projects/:project/tables/:table', () => {});

Server.use('/firebase', router);
