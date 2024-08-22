import express from 'express';
import { showAllPatients, createNewPatientForm, createNewPatient, editPatientForm, editPatient, removePatient } from '../controllers/patientController.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.get('/', showAllPatients);
router.get('/create', createNewPatientForm);
router.post('/create', upload.single('image'), createNewPatient);
router.get('/edit/:id', editPatientForm);
router.post('/edit/:id', upload.single('image'), editPatient);
router.post('/delete/:id', removePatient);

export default router;
