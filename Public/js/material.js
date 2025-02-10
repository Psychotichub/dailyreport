document.addEventListener('DOMContentLoaded', initMaterialSubmit);

async function initMaterialSubmit() {
    const submitButton = document.getElementById('submit-btn');
    const materialNameInput = document.getElementById('material-name');
    const unitInput = document.getElementById('unit');
    const materialPriceInput = document.getElementById('material-price');
    const laborPriceInput = document.getElementById('labor-price');
    const submittedTableBody = document.querySelector('#submitted-table tbody');
    const searchInput = document.getElementById('search-material-name');
    const searchResult = document.getElementById('search-result');
    const autocompleteList = document.querySelector('.autocomplete-list');

    let materialsList = [];
    let currentEditingMaterial = null;

    // Autocomplete functionality
    materialNameInput.addEventListener('input', handleAutocomplete);
    materialNameInput.addEventListener('keydown', handleKeyboardNavigation);
    materialNameInput.addEventListener('blur', () => {
        setTimeout(() => autocompleteList.classList.add('hidden'), 100);
    });

    async function loadMaterials() {
        try {
            const response = await fetch('/material-submit');
            const materials = await response.json();
            if (response.ok) {
                submittedTableBody.innerHTML = '';
                materialsList = materials.map(material => material.materialName);
                materials.forEach(addMaterialToTable);
                submittedTable.classList.toggle('hidden', materials.length === 0);
            }
        } catch (error) {
            console.error("Error loading materials:", error);
            showAlert('Error loading materials', 'error');
        }
    }

    function handleAutocomplete(e) {
        const searchTerm = e.target.value.toLowerCase();
        autocompleteList.innerHTML = '';
        
        if (!searchTerm) {
            autocompleteList.classList.add('hidden');
            return;
        }

        const filteredMaterials = materialsList.filter(material => 
            material.toLowerCase().includes(searchTerm)
        );

        if (filteredMaterials.length > 0) {
            filteredMaterials.forEach((material, index) => {
                const div = document.createElement('div');
                div.className = 'autocomplete-item';
                div.textContent = material;
                div.setAttribute('role', 'option');
                div.setAttribute('aria-selected', 'false');
                div.id = `autocomplete-item-${index}`;
                div.onmousedown = () => selectMaterial(material);
                autocompleteList.appendChild(div);
            });
            autocompleteList.classList.remove('hidden');
        } else {
            autocompleteList.classList.add('hidden');
        }
    }

    function handleKeyboardNavigation(e) {
        const items = Array.from(autocompleteList.children);
        const currentIndex = items.findIndex(item => item.getAttribute('aria-selected') === 'true');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
            updateSelectedItem(items, nextIndex);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
            updateSelectedItem(items, prevIndex);
        } else if (e.key === 'Enter' && currentIndex !== -1) {
            e.preventDefault();
            selectMaterial(items[currentIndex].textContent);
        }
    }

    function updateSelectedItem(items, index) {
        items.forEach(item => {
            item.setAttribute('aria-selected', 'false');
            item.classList.remove('selected');
        });
        items[index].setAttribute('aria-selected', 'true');
        items[index].classList.add('selected');
        items[index].scrollIntoView({ block: 'nearest' });
    }

    function selectMaterial(material) {
        materialNameInput.value = material;
        autocompleteList.classList.add('hidden');
    }

    submitButton.addEventListener('click', async (e) => {
        e.preventDefault();
        await handleSubmit();
    });

    async function handleSubmit() {
        const materialData = getFormData();
        
        if (!validateForm(materialData)) {
            showAlert('Please fill in all fields correctly', 'error');
            return;
        }

        try {
            if (currentEditingMaterial) {
                await updateMaterial(materialData);
            } else {
                await createMaterial(materialData);
            }
            await loadMaterials();
            resetForm();
            showAlert(`Material ${currentEditingMaterial ? 'updated' : 'added'} successfully`, 'success');
        } catch (error) {
            console.error('Operation failed:', error);
            showAlert(`Error ${currentEditingMaterial ? 'updating' : 'adding'} material`, 'error');
        }
    }

    function getFormData() {
        return {
            materialName: materialNameInput.value.trim(),
            unit: unitInput.value,
            materialPrice: parseFloat(materialPriceInput.value),
            laborPrice: parseFloat(laborPriceInput.value)
        };
    }

    function validateForm({ materialName, unit, materialPrice, laborPrice }) {
        return materialName && unit && !isNaN(materialPrice) && !isNaN(laborPrice);
    }

    async function createMaterial(materialData) {
        const checkResponse = await fetch(`/material-submit/check/${materialData.materialName}`);
        const checkResult = await checkResponse.json();
        
        if (checkResult.exists) {
            throw new Error('Material name already exists');
        }

        const response = await fetch('/material-submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(materialData)
        });

        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.message);
        }
    }

    async function updateMaterial(materialData) {
        const response = await fetch('/material-submit', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(materialData)
        });

        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.message);
        }
        currentEditingMaterial = null;
    }

    function addMaterialToTable(material) {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${material.materialName}</td>
            <td>${material.unit}</td>
            <td>${material.materialPrice.toFixed(2)} €</td>
            <td>${material.laborPrice.toFixed(2)} €</td>
            <td>
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
            </td>
        `;

        newRow.querySelector('.edit-btn').addEventListener('click', () => editMaterial(material, newRow));
        newRow.querySelector('.delete-btn').addEventListener('click', () => deleteMaterial(material.materialName, newRow));
        submittedTableBody.appendChild(newRow);
    }

    function editMaterial(material, row) {
        currentEditingMaterial = material.materialName;
        materialNameInput.value = material.materialName;
        unitInput.value = material.unit;
        materialPriceInput.value = material.materialPrice;
        laborPriceInput.value = material.laborPrice;
        submitButton.textContent = 'Update';
        row.remove();
    }

    async function deleteMaterial(materialName, row) {
        if (!confirm('Are you sure you want to delete this material?')) return;

        try {
            const response = await fetch(`/material-submit/${materialName}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message);
            }
            
            row.remove();
            materialsList = materialsList.filter(item => item !== materialName);
            submittedTable.classList.toggle('hidden', submittedTableBody.children.length === 0);
            showAlert('Material deleted successfully', 'success');
        } catch (error) {
            console.error("Error deleting material:", error);
            showAlert('Error deleting material', 'error');
        }
    }

    function resetForm() {
        materialNameInput.value = '';
        unitInput.value = 'm';
        materialPriceInput.value = '';
        laborPriceInput.value = '';
        submitButton.textContent = 'Submit';
        currentEditingMaterial = null;
    }

    function showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 3000);
    }

    // Initialize
    loadMaterials();
}