import 'dotenv/config';
import express, { Request } from 'express';
import cors from 'cors';
import { connect as connectDatabase } from '@db/mongodb';
import { v1Router } from '@/controllers';
import * as process from 'node:process';

const morgan = require('morgan');

const app = express();

app.use(
    cors<Request>({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 204,
    }),
);
process.env.ENVIRONMENT && app.use(morgan('dev'));
app.use(express.json());

app.use('/api/v1', v1Router());

async function startServer() {
    const PORT = parseInt(process.env.PORT || '8080', 10);
    const HOST = '0.0.0.0';

    try {
        console.log('Attempting to connect to database...');
        await connectDatabase();
        console.log('Database connection successful.');

        app.listen(PORT, HOST, () => {
            console.log(`Server is running on http://127.0.0.1:${PORT} (Listening on ${HOST})`);
        });
    } catch (error) {
        console.error(
            'CRITICAL STARTUP FAILURE: Server cannot be started without database connection.',
        );
        console.error(error);
        process.exit(1);
    }
}

startServer();
