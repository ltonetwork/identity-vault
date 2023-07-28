import { route as list } from './list-identifiers.js';
import { route as create } from './create-identifier.js';
import { route as get } from './get-identifier.js';
import { Router } from 'express';

export const routes = Router();
routes.get('/', list);
routes.post('/', create);
routes.get('/:did', get);
