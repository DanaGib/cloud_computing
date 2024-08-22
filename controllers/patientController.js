import { getAllPatients, getPatientById, createPatient, updatePatient, deletePatient } from '../models/patientModel.js';
import { getAllMedications } from '../models/medicationModel.js';
import { calculateAge} from '../public/js/calculateAge.js';
import { formatDate,sendWhatsAppMessage } from '../util.js';
import path from 'path';
import FormData from 'form-data';
import got from 'got';
import fs from 'fs';
import { ObjectId } from 'mongodb';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const apiKey = process.env.IMAGGAAPIKEY;
const apiSecret = process.env.IMAGGAAPISECRET;

export const showAllPatients = (req, res) => {
    getAllPatients()
        .then(patients => {
            patients.forEach(patient => {
                patient.age = calculateAge(patient.dob);
            });
            res.render('patients', { patients, formatDate });
        })
        .catch(err => {
            res.status(500).json({ error: "Could not fetch the documents/data" });
        });
};

export const createNewPatientForm = (req, res) => {
    getAllMedications()
        .then(medications => {
            res.render('create', { conditions: ['Heart disease', 'Kidneys', 'Digestion', 'Diabetes', 'Asthma'], medications });
        })
        .catch(err => {
            res.status(500).json({ error: "Could not fetch the medications data" });
        });
};

export const createNewPatient = async (req, res) => {
    const newMedications = req.body.medications || [];
    const newConditions = req.body.chronicalCondition || [];

    const newPatient = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        gender: req.body.gender,
        phone: req.body.phone,
        email: req.body.email,
        pregnant: req.body.pregnant === 'on' || false, 
        nursing: req.body.nursing === 'on' || false,
        dob: req.body.dob ? new Date(req.body.dob) : null,
        chronicalCondition: newConditions,
        medications: newMedications,
    };

    // Check if an image was uploaded
    if (req.file) {
        // const imgPath = path.join(__dirname, req.file.path);
        const imgPath = path.join(__dirname, '../uploads', req.file.filename);
        const formData = new FormData();
        formData.append('image', fs.createReadStream(imgPath));

        try {
            const response = await got.post('https://api.imagga.com/v2/faces/detections', {
                body: formData,
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(apiKey + ':' + apiSecret).toString('base64')
                }
            });

            const result = JSON.parse(response.body);
            const faces = result.result.faces;

            if (faces && faces.length > 0) {
                newPatient.image = `/uploads/${req.file.filename}`;
            } else {
                fs.unlinkSync(imgPath);
                return res.render('create', { 
                    errorMessage: "No face detected. Please upload an image with a clear face.", 
                    conditions: newConditions,
                    medications: await getAllMedications(),
                    patient: newPatient,
                });
            }
        } catch (error) {
            console.error("Imagga API error:", error.response?.body || error.message);
            return res.status(500).send("Error processing the image.");
        }
    }

    try {
        const medications = await getAllMedications();

        let conflicts = [];

        newMedications.forEach(medicationName => {
            const medication = medications.find(med => med.drugName === medicationName);
            if (medication) {
                medication.relatedConditions.forEach(condition => {
                    if (newConditions.includes(condition)) {
                        conflicts.push(`Medication ${medicationName} conflicts with your condition: ${condition}`);
                    }
                });

                medication.interactions.forEach(interaction => {
                    if (newMedications.includes(interaction.withDrug)) {
                        conflicts.push(`Medication ${medicationName} interacts with ${interaction.withDrug}: ${interaction.interactionDescription}`);
                    }
                });
            }
        });

        if (conflicts.length > 0) {  
            const messageBody = `The patient ${newPatient.lastName} ${newPatient.firstName} has the following conflicts:\n${conflicts.join('\n')}`           
            await sendWhatsAppMessage(messageBody) 
            return res.render('create', {
                errorMessage: conflicts.join(' <br> '),
                conditions: newConditions,
                medications,
                patient: newPatient,
            });
        }

        await createPatient(newPatient);
        res.redirect('/patients');
    } catch (err) {
        console.error("Failed to create patient:", err);
        res.status(500).json({ error: "Could not create the patient document" });
    }
};

export const editPatientForm = (req, res) => {
    const patientId = req.params.id;

    if (ObjectId.isValid(patientId)) {
        getPatientById(patientId)
            .then(patient => {
                if (patient) {
                    getAllMedications()
                        .then(medications => {
                            patient.medications = patient.medications || [];
                            patient.chronicalCondition = patient.chronicalCondition || [];
                            res.render('edit', { patient, medications, formatDate, conditions: ['Heart disease', 'Kidneys', 'Digestion', 'Diabetes', 'Asthma'] });
                        })
                        .catch(err => {
                            console.error("Failed to fetch medications:", err);
                            res.status(500).send('Error fetching medications');
                        });
                } else {
                    res.status(404).send('Patient not found');
                }
            })
            .catch(err => {
                console.error("Failed to fetch patient:", err);
                res.status(500).send('Error fetching patient data');
            });
    } else {
        res.status(400).send('Invalid patient ID');
    }
};

export const editPatient = async (req, res) => {
    const patientId = req.params.id;
    const updatedMedications = req.body.medications || [];
    const updatedConditions = req.body.chronicalCondition || [];
    const patient = await getPatientById(patientId);

    const updateData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
        email: req.body.email,
        gender: req.body.gender,
        pregnant: req.body.gender === 'female' && req.body.pregnant === 'on',
        nursing: req.body.gender === 'female' && req.body.nursing === 'on',
        dob: req.body.dob ? new Date(req.body.dob) : null,
        chronicalCondition: updatedConditions,
        medications: updatedMedications,
    };

    if (req.file) {
        updateData.image = `/uploads/${req.file.filename}`;
    }

    if (ObjectId.isValid(patientId)) {
        try {
            const medications = await getAllMedications();

            let conflicts = [];

            updatedMedications.forEach(medicationName => {
                const medication = medications.find(med => med.drugName === medicationName);
                if (medication) {
                    medication.relatedConditions.forEach(condition => {
                        if (updatedConditions.includes(condition)) {
                            conflicts.push(`Medication ${medicationName} conflicts with your condition: ${condition}`);
                        }
                    });

                    medication.interactions.forEach(interaction => {
                        if (updatedMedications.includes(interaction.withDrug)) {
                            conflicts.push(`Medication ${medicationName} interacts with ${interaction.withDrug}: ${interaction.interactionDescription}`);
                        }
                    });
                }
            });

            if (conflicts.length > 0) {
                const messageBody = `The patient ${patient.lastName} ${patient.firstName} has the following conflicts:\n${conflicts.join('\n')}`           
                await sendWhatsAppMessage(messageBody) 
                return res.render('edit', {
                    patient: { ...patient, ...updateData },
                    medications,
                    conditions: updatedConditions,
                    formatDate,
                    errorMessage: conflicts.join('<br>'),
                });
            }

            await updatePatient(patientId, updateData);
            res.redirect('/patients');
        } catch (err) {
            console.error("Failed to update patient:", err);
            res.status(500).json({ error: "Could not update the patient document" });
        }
    } else {
        res.status(400).json({ error: "Not a valid patient id" });
    }
};

export const removePatient = (req, res) => {
    const patientId = req.params.id;

    if (ObjectId.isValid(patientId)) {
        deletePatient(patientId)
            .then(() => {
                res.redirect('/patients');
            })
            .catch(err => {
                console.error("Failed to delete patient:", err);
                res.status(500).json({ error: "Could not delete the patient" });
            });
    } else {
        res.status(400).json({ error: "Not a valid patient id" });
    }
};
