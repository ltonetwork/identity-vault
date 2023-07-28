import { route as list } from './list-credentials.js';
import { route as issue } from './issue-credential.js';
import { route as get } from './get-credential.js';
import { route as getStatus } from './get-status.js';
import { route as updateStatus } from './update-status.js';
import { Router } from 'express';

export const routes = Router();
routes.get('/', list);
routes.post('/', issue);
routes.get('/:hash', get);
routes.get('/:hash/status', getStatus);
routes.post('/:hash/status', updateStatus);
