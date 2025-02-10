const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { getMaterials, addMaterial, updateMaterial, deleteMaterial, checkMaterialExists, searchMaterial } = materialController;

router.get('/', getMaterials); // Get  materials
router.post('/', addMaterial); // Add new material
router.put('/', updateMaterial); // Update material
router.delete('/:materialName', deleteMaterial); // Delete material by name
router.get('/check/:materialName', checkMaterialExists); // Check if material already exists in database
router.get('/search/:materialName', searchMaterial); // Search material by name

module.exports = router;
