document.addEventListener('DOMContentLoaded', initMaterialSubmit);

async function initMaterialSubmit() {
    const submitButton = document.getElementById('submit-btn');
    const materialNameInput = document.getElementById('material-name');
    const unitInput = document.getElementById('unit');
    const materialPriceInput = document.getElementById('material-price');
    const laborPriceInput = document.getElementById('labor-price');
    const submittedTable = document.getElementById('submitted-table');
    const submittedTableBody = document.querySelector('#submitted-table tbody');
    const materialListDatalist = document.getElementById('material-list');
    const searchInput = document.getElementById('search-material-name');
    const searchResult = document.getElementById('search-result');
    const searchMaterialListDatalist = document.getElementById('search-material-list');

    let materialsList = [];

    async function loadMaterials() {
        try {
            const response = await fetch('/material-submit');
            const materials = await response.json();
            if (response.ok) {
                submittedTableBody.innerHTML = '';
                materialsList = materials.map(material => material.materialName);
                materials.forEach(addMaterialToTable);
                updateMaterialList();
                submittedTable.classList.toggle('hidden', materials.length === 0);
            } else {
                console.error("Error fetching materials:", materials.message);
            }
        } catch (error) {
            console.error("Error loading materials:", error);
        }
    }

    loadMaterials();

    submitButton.addEventListener('click', async () => {
        const materialName = materialNameInput.value.trim();
        const unit = unitInput.value;
        const materialPrice = parseFloat(materialPriceInput.value);
        const laborPrice = parseFloat(laborPriceInput.value);

        if (!materialName || !unit || isNaN(materialPrice) || isNaN(laborPrice)) {
            alert('Please fill in all fields correctly.');
            return;
        }

        const isEditing = submitButton.dataset.editing;
        if (isEditing) {
            try {
                const response = await fetch('/material-submit', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ materialName, unit, materialPrice, laborPrice }),
                });

                if (response.ok) {
                    alert('Material updated successfully.');
                    materialsList.push(materialName);
                    updateMaterialList();
                    addMaterialToTable({ materialName, unit, materialPrice, laborPrice });
                    resetForm();
                } else {
                    const errorResult = await response.json();
                    console.error('Error updating material:', errorResult.message);
                    alert('Error: ' + errorResult.message);
                }
            } catch (error) {
                console.error('Error updating data:', error);
                alert('Error updating data on server.');
            }
        } else {
            try {
                const checkResponse = await fetch(`/material-submit/check/${materialName}`);
                const checkResult = await checkResponse.json();
                if (checkResult.exists) {
                    alert('Material name already exists.');
                    return;
                }
            } catch (error) {
                console.error('Error checking material name:', error);
                alert('Error checking material name on server.');
                return;
            }

            try {
                const response = await fetch('/material-submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ materialName, unit, materialPrice, laborPrice }),
                });

                if (response.ok) {
                    const result = await response.json();
                    addMaterialToTable(result);
                    materialsList.push(materialName);
                    updateMaterialList();
                    submittedTable.classList.remove('hidden');
                    alert('Material added successfully.');
                } else {
                    const errorResult = await response.json();
                    console.error('Error adding material:', errorResult.message);
                    alert('Error: ' + errorResult.message);
                }
            } catch (error) {
                console.error('Error submitting data:', error);
                alert('Error submitting data to server.');
            }
        }

        resetForm();
    });

    searchInput.addEventListener('input', async () => {
        const searchName = searchInput.value.trim();
        if (!searchName) {
            searchResult.innerHTML = '';
            return;
        }

        try {
            const response = await fetch(`/material-submit/search/${searchName}`);
            const material = await response.json();

            if (response.ok && material) {
                searchResult.innerHTML = `
                    <p>Material Name: ${material.materialName}</p>
                    <p>Unit: ${material.unit}</p>
                    <p>Material Price: ${material.materialPrice} €</p>
                    <p>Labor Price: ${material.laborPrice} €</p>
                `;
            } else {
                searchResult.innerHTML = '<p>Material not found.</p>';
            }
        } catch (error) {
            console.error('Error searching material:', error);
            alert('Error searching material on server.');
        }
    });

    function addMaterialToTable({ materialName, unit, materialPrice, laborPrice }) {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${materialName}</td>
            <td>${unit}</td>
            <td>${materialPrice} €</td>
            <td>${laborPrice} €</td>
            <td>
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
            </td>
        `;
        submittedTableBody.appendChild(newRow);

        newRow.querySelector('.edit-btn').addEventListener('click', () => {
            materialNameInput.value = materialName;
            unitInput.value = unit;
            materialPriceInput.value = materialPrice;
            laborPriceInput.value = laborPrice;
            submitButton.textContent = 'Update';
            submitButton.dataset.editing = materialName;

            newRow.remove();
            materialsList = materialsList.filter(item => item !== materialName);
            updateMaterialList();
        });

        newRow.querySelector('.delete-btn').addEventListener('click', async () => {
            try {
                const response = await fetch(`/material-submit/${materialName}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    console.log('Material deleted successfully');
                    newRow.remove();
                    materialsList = materialsList.filter(item => item !== materialName);
                    updateMaterialList();
                    submittedTable.classList.toggle('hidden', submittedTableBody.children.length === 0);
                } else {
                    const result = await response.json();
                    console.error('Error deleting material:', result.message);
                    alert("Error deleting material: " + result.message);
                }
            } catch (error) {
                console.error("Error deleting material:", error);
                alert("An error occurred while deleting the material.");
            }
        });
    }

    function updateMaterialList() {
        materialListDatalist.innerHTML = '';
        searchMaterialListDatalist.innerHTML = '';
        materialsList.forEach(material => {
            const option = document.createElement('option');
            option.value = material;
            materialListDatalist.appendChild(option);
            searchMaterialListDatalist.appendChild(option.cloneNode(true));
        });
    }

    materialNameInput.addEventListener('input', () => {
        materialListDatalist.querySelector(`option[value="${materialNameInput.value}"]`);

        const query = materialNameInput.value.toLowerCase();
        const filteredOptions = Array.from(materialListDatalist.options).filter(option =>
            option.value.toLowerCase().includes(query)
        );

        const dropdown = document.getElementById('material-dropdown');
        dropdown.innerHTML = '';

        if (filteredOptions.length > 0) {
            filteredOptions.forEach(option => {
                const dropdownItem = document.createElement('div');
                dropdownItem.className = 'dropdown-item';
                dropdownItem.textContent = option.value;
                dropdownItem.addEventListener('click', () => {
                    materialNameInput.value = option.value;
                    dropdown.classList.add('hidden');
                });
                dropdown.appendChild(dropdownItem);
            });
            dropdown.classList.remove('hidden');
        } else {
            dropdown.classList.add('hidden');
        }
    });

    function resetForm() {
        materialNameInput.value = '';
        unitInput.value = '';
        materialPriceInput.value = '';
        laborPriceInput.value = '';
        submitButton.textContent = 'Submit';
        delete submitButton.dataset.editing;
    }
}
