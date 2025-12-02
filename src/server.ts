import 'dotenv/config';
import express from 'express';
import { Request } from 'express';
import cors from 'cors';
import 'database/mongodb';
import { connect as connectDatabase } from './database/mongodb';

connectDatabase().catch((err: Error) => {
    console.error(err);
    process.exit(1);
});

const app = express();
app.use(cors<Request>);

const PORT = (process.env.PORT && parseInt(process.env.PORT)) || 8080;

app.use(express.json());

app.listen(PORT);
