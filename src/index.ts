import express from 'express';
import bodyParser from 'body-parser';
import { Request, Response} from 'express';
import swaggerUi from 'swagger-ui-express';
import { packageInfo } from './packageInfo.js';
import openapiDocument from './openapi.json' assert { type: 'json' };
import { routes as identifierRoutes } from './identifiers/index.js';
import { routes as credentialRoutes } from './credentials/index.js';

const PORT = process.env.PORT || 3000;

const app = express();
app.use(bodyParser.json());

app.use('/api-docs', swaggerUi.serve);
openapiDocument.info.version = packageInfo.version;
app.get('/api-docs', swaggerUi.setup(openapiDocument));

app.get('/', (req: Request, res: Response) => {
  res.redirect('./api-docs');
});

app.use('/identifiers', identifierRoutes);
app.use('/credentials', credentialRoutes);

// Start the server
app.listen(PORT);
console.log(`Server running at http://localhost:${PORT}/`);
