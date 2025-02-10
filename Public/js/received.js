document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('date');
    const materialNameInput = document.getElementById('material-name');
    const quantityInput = document.getElementById('quantity');
    const notesInput = document.getElementById('notes');
    const saveButton = document.querySelector('.save-reoprt');
    const dataTable = document.querySelector('#data-table tbody');
    const savedDataContainer = document.getElementById('saved-data-container');
    const savedDateContainer = document.getElementById('saved-date');
    const materialList = document.getElementById('material-list');
    const filterButton = document.getElementById('filter-btn');
    const materialsTable = document.getElementById('materials-table');
    const filterDateInput = document.getElementById('filter-date');
    const printButton = document.querySelector('.print');
    const pdfButton = document.querySelector('.pdf');
    const sendDataButton = document.querySelector('.send-data');

    const clearInputs = () => {
        materialNameInput.value = '';
        quantityInput.value = '';
        notesInput.value = '';
    };

    const showElement = (element) => element.classList.remove('hidden');
    const hideElement = (element) => element.classList.add('hidden');

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    // Set current date in the date input
    const currentDate = new Date().toISOString().split('T')[0];
    dateInput.value = currentDate;
    filterDateInput.value = currentDate;

    let selectedUnit = '';

    const populateMaterialList = async () => {
        try {
            const response = await fetch('/material-submit');
            if (!response.ok) throw new Error('Failed to fetch material names');
            const materials = await response.json();
            console.log('Fetched materials:', materials);
            materialList.innerHTML = '';
            materials.forEach(material => {
                const option = document.createElement('option');
                option.value = material.materialName;
                option.dataset.unit = material.unit;
                materialList.appendChild(option);
            });
        } catch (error) {
            console.error('Error fetching material names:', error);
            alert('Failed to load material names. Please check the console.');
        }
    };
    populateMaterialList();

    materialNameInput.addEventListener('input', () => {
        const selectedOption = materialList.querySelector(`option[value="${materialNameInput.value}"]`);
        selectedUnit = selectedOption ? selectedOption.dataset.unit : '';

        const query = materialNameInput.value.toLowerCase();
        const filteredOptions = Array.from(materialList.options).filter(option =>
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

    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('material-dropdown');
        if (!materialNameInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });

    materialNameInput.addEventListener('blur', () => {
        const isValid = Array.from(materialList.options).some(option =>
            option.value === materialNameInput.value.trim()
        );
        if (!isValid) {
            materialNameInput.value = '';
        }
    });

    saveButton.addEventListener('click', async () => {
        const materialName = materialNameInput.value.trim();
        const quantity = quantityInput.value.trim();
        const notes = notesInput.value.trim();
        const date = dateInput.value;

        if (!materialName || !quantity || !date || !selectedUnit) {
            alert('Please fill in all required fields, including selecting a material and unit.');
            return;
        }

        const selectedOption = Array.from(materialList.options).find(option => option.value === materialName);
        const unit = selectedOption ? selectedOption.dataset.unit : selectedUnit;

        const data = {
            materialName,
            quantity: Number(quantity),
            unit,
            notes,
            date
        };

        try {
            let response;
            if (saveButton.dataset.id) {
                const id = saveButton.dataset.id;
                response = await fetch(`http://localhost:3000/received/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                saveButton.textContent = 'Save';
                delete saveButton.dataset.id;
            } else {
                response = await fetch('http://localhost:3000/received', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ materials: [data] })
                });
            }
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            alert('Data saved successfully!');
            dataTable.innerHTML = '';
            hideElement(savedDataContainer);
            hideElement(sendDataButton);
            savedDateContainer.textContent = '';
            fetchReceivedByDate(filterDateInput.value);
        } catch (error) {
            console.error('Error saving data:', error);
            alert('Failed to save data.');
        }
        clearInputs();
    });

    pdfButton.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.autoTable({ html: '#data-table' });
        const pdfData = doc.output('blob');
        const url = URL.createObjectURL(pdfData);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'received-materials.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    sendDataButton.addEventListener('click', async () => {
        const rows = document.querySelectorAll('#data-table tbody tr');
        const dataToSend = Array.from(rows).map(row => {
            const cells = row.querySelectorAll('td');
            const quantityWithUnit = cells[1].textContent.trim();
            const [quantity, unit] = quantityWithUnit.split(' ');

            return {
                materialName: cells[0].textContent.trim(),
                quantity: Number(quantity),
                unit: unit.trim(),
                notes: cells[2].textContent.trim(),
                date: dateInput.value
            };
        });

        if (!dataToSend.length) {
            alert('No data to send.');
            return;
        }

        try {
            const response = await fetch('/received', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ materials: dataToSend }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            alert('Data sent successfully!');
            dataTable.innerHTML = '';
            hideElement(savedDataContainer);
            hideElement(sendDataButton);
            savedDateContainer.textContent = '';
        } catch (error) {
            alert('Failed to send data to server.');
        }
    });
    const fetchReceivedByDate = async (date) => {
        try {
            const response = await fetch(`/received/date/${date}`);
            if (!response.ok) throw new Error('Failed to fetch received materials');
            const dailyReports = await response.json();

            const tableBody = materialsTable.querySelector('tbody');
            tableBody.innerHTML = '';

            dailyReports.forEach((report) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${report.materialName}</td>
                    <td>${report.quantity} ${report.unit}</td>
                    <td>${report.notes}</td>
                    <td>
                        <button class="edit-btn" data-id="${report._id}">Edit</button>
                        <button class="delete-btn" data-id="${report._id}">Delete</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });

            showElement(materialsTable);
            showElement(printButton);
            showElement(pdfButton);
        } catch (error) {
            console.error('Error fetching Received Materials:', error);
            alert('Failed to fetch Received Materials.');
        }
    };

    fetchReceivedByDate(currentDate);

    filterButton.addEventListener('click', async () => {
        const selectedDate = filterDateInput.value;
        if (!selectedDate) {
            alert('Please select a date!');
            return;
        }

        fetchReceivedByDate(selectedDate);
    });

    materialsTable.addEventListener('click', async (event) => {
        if (event.target.classList.contains('edit-btn')) {
            const id = event.target.dataset.id;
            const row = event.target.closest('tr');
            const materialName = row.children[0].textContent.trim();
            const quantity = row.children[1].textContent.split(' ')[0].trim();
            const unit = row.children[1].textContent.split(' ')[1].trim();
            const notes = row.children[2].textContent.trim();

            materialNameInput.value = materialName;
            quantityInput.value = quantity;
            notesInput.value = notes;
            selectedUnit = unit;

            saveButton.textContent = 'Update';
            saveButton.dataset.id = id;
        }
    });

    materialsTable.addEventListener('click', async (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const id = event.target.dataset.id;
            try {
                const response = await fetch(`/received/${id}`, {
                    method: 'DELETE'
                });
                if (!response.ok) throw new Error('Failed to delete received material');
                alert('received material deleted successfully');
                fetchReceivedByDate(filterDateInput.value);
            } catch (error) {
                console.error('Error deleting received material:', error);
                alert('Failed to delete received material.');
            }
        }
    });

    printButton.addEventListener('click', () => {
        const printWindow = window.open('', '', 'height=600,width=800');
        if (!printWindow) {
            alert('Unable to open print window. Please check your browser settings.');
            return;
        }

        printWindow.document.write('<html><head><title>Print</title>');
        printWindow.document.write('<style>table { width: 100%; border-collapse: collapse; } td, th { border: 1px solid black; padding: 8px; }</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(`<h1>Received Materials: ${filterDateInput.value}</h1>`);

        const tableClone = materialsTable.cloneNode(true);
        tableClone.querySelectorAll('th:last-child, td:last-child').forEach(cell => cell.remove());
        printWindow.document.write(tableClone.outerHTML);

        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    });
});
