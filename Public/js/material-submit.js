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
    
    // Fetch and display materials on page load
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

    // Load materials on page load
    loadMaterials();

    // Handle the submit button click
    submitButton.addEventListener('click', async () => {
        const materialName = materialNameInput.value.trim();
        const unit = unitInput.value;
        const materialPrice = parseFloat(materialPriceInput.value);
        const laborPrice = parseFloat(laborPriceInput.value);

        if (!materialName || !unit || isNaN(materialPrice) || isNaN(laborPrice)) {
            alert('Please fill in all fields correctly.');
            return;
        }

        // Handle Edit or Add functionality
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

    // Handle the search input change
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
                // Clear the search input value
                searchInput.value = '';
                
            } else {
                searchResult.innerHTML = '<p>Material not found.</p>';
            }
        } catch (error) {
            console.error('Error searching material:', error);
            alert('Error searching material on server.');
        }
    });

    // Add material to the table
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

        // Add event listener for the edit button
        newRow.querySelector('.edit-btn').addEventListener('click', () => {
            materialNameInput.value = materialName;
            unitInput.value = unit;
            materialPriceInput.value = materialPrice;
            laborPriceInput.value = laborPrice;
            submitButton.textContent = 'Update';
            submitButton.dataset.editing = materialName; // Store editing state

            newRow.remove(); // Remove row for editing
            materialsList = materialsList.filter(item => item !== materialName);
            updateMaterialList();
        });

        // Add event listener for the delete button
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

    // Update datalist with materials from materialsList
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

    // Reset the form to default state
    function resetForm() {
        materialNameInput.value = '';
        unitInput.value = '';
        materialPriceInput.value = '';
        laborPriceInput.value = '';
        submitButton.textContent = 'Submit';
        delete submitButton.dataset.editing;
    }
}
