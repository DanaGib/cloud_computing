import express from 'express';
import { showAllMedications } from '../controllers/medicationController.js';

const router = express.Router();

router.get('/', showAllMedications);

export default router;
