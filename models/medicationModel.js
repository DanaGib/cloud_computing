import { getDb } from '../db.js';

export const getAllMedications = () => {
    const db = getDb();
    return db.collection('medications').find().toArray();
};
