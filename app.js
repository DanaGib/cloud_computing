import express from 'express';
import bodyParser from 'body-parser';
import { connectToDb } from './db.js';
import patientRoutes from './routes/patientRoutes.js';
import medicationRoutes from './routes/medicationRoutes.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use('/uploads', express.static('uploads'));

// const uploadsDir = './uploads';
// if (!fs.existsSync(uploadsDir)) {
//     fs.mkdirSync(uploadsDir);
// }
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

connectToDb((err) => {
    if (!err) {
        app.listen(3000, () => {
            console.log("App listening on port 3000");
        });
    }
});

app.use('/patients', patientRoutes);
app.use('/medications', medicationRoutes);

app.get('/', (req, res) => {
    res.render('home');
});

app.use((req, res) => {
    res.status(404).render('404');
});
