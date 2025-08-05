import fs from 'fs';
import path from 'path';

import { specs } from '../config/swagger';
fs.mkdirSync(path.join(__dirname, '../../dist'), { recursive: true });
fs.writeFileSync(
  path.join(__dirname, '../../dist/swagger.json'),
  JSON.stringify(specs, null, 2)
);

console.log('Swagger spec generated to dist/swagger.json');
