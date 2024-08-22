import { ObjectId } from 'mongodb';
import { getDb } from '../db.js';

export const getAllPatients = () => {
    const db = getDb();
    return db.collection('patients').find().toArray();
};

export const getPatientById = (id) => {
    const db = getDb();
    return db.collection('patients').findOne({ _id: new ObjectId(id) });
};

export const createPatient = (patientData) => {
    const db = getDb();
    return db.collection('patients').insertOne(patientData);
};

export const updatePatient = (id, updateData) => {
    const db = getDb();
    return db.collection('patients').updateOne({ _id: new ObjectId(id) }, { $set: updateData });
};

export const deletePatient = (id) => {
    const db = getDb();
    return db.collection('patients').deleteOne({ _id: new ObjectId(id) });
};
