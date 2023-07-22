import express from 'express';
import bodyParser from 'body-parser';
import { Request, Response} from 'express';
import swaggerUi from 'swagger-ui-express';
import { packageInfo } from './packageInfo.js';
import openapiDocument from './openapi.json' assert { type: 'json' };
import { routes as identifiers } from './identifiers/index.js';
import { routes as credentials } from './credentials/index.js';

const app = express();
app.use(bodyParser.json());

app.use('/api-docs', swaggerUi.serve);
openapiDocument.info.version = packageInfo.version;
app.get('/api-docs', swaggerUi.setup(openapiDocument));

app.get('/', (req: Request, res: Response) => {
  res.redirect('./api-docs');
});

app.get('/identifiers', identifiers.list);
app.post('/identifiers', identifiers.create);
app.get('/identifiers/:did', identifiers.get);

app.get('/credentials', credentials.list);
app.post('/credentials', credentials.issue);
app.get('/credentials/:hash', credentials.get);



// Start the server
app.listen(3000);
console.log('Server running at http://localhost:3000/');
