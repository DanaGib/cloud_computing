import { getAllMedications } from '../models/medicationModel.js';

export const showAllMedications = (req, res) => {
    getAllMedications()
        .then(medications => {
            res.render('medications', { medications });
        })
        .catch(err => {
            console.error("Failed to fetch medications:", err);
            res.status(500).json({ error: "Could not fetch the medications data" });
        });
};
