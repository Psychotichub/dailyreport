document.addEventListener('DOMContentLoaded', () => {
    const totalPriceElement = document.getElementById('grand-total'); // Ensure the correct ID is used
    const startDateInput = document.getElementById('startDateInput');
    const endDateInput = document.getElementById('endDateInput');
    const fetchButton = document.getElementById('fetchButton');
    const selectedDateRangeElement = document.getElementById('selected-date-range'); // New element to show the date range

    const showElement = (element) => element.classList.remove('hidden');
    const hideElement = (element) => element.classList.add('hidden');

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(); // Better formatting to show only the date
    };

    // Set current date in the date inputs
    const currentDate = new Date().toISOString().split('T')[0];
    startDateInput.value = currentDate;
    endDateInput.value = currentDate;

    let selectedUnit = '';  // Variable to store the selected unit

    // Populate the material list from server
    const populateMaterialList = async () => {
        try {
            const response = await fetch('http://localhost:3000/material-submit');
            if (!response.ok) throw new Error('Failed to fetch material names');
            
            const materials = await response.json();
            console.log('Fetched materials:', materials);  // Check the output here in the browser console

          
        } catch (error) {
            console.error('Error fetching material names:', error);
            alert('Failed to load material names. Please check the console.');
        }
    };
    populateMaterialList();

    // Ensure the content div is hidden initially
    hideElement(document.getElementById('content'));

    // Fetch and display data based on date range
    fetchButton.addEventListener('click', async () => {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;

        // Clear table data if date range is not selected
        if (!startDate || !endDate) {
            alert('Please select a valid date range.');
            document.getElementById('materialsTableBody').innerHTML = ''; // Clear existing rows
            hideElement(totalPriceElement);
            hideElement(document.getElementById('content'));
            hideElement(document.getElementById('export'));
            return;
        }

        try {
            // Ensure the date format includes the time component for the query
            const formattedStartDate = new Date(startDate).toISOString().split('T')[0] + 'T00:00:00.000Z';
            const formattedEndDate = new Date(endDate).toISOString().split('T')[0] + 'T23:59:59.999Z';

            const [materialResponse, priceResponse] = await Promise.all([
                fetch(`http://localhost:3000/daily-reports?start=${formattedStartDate}&end=${formattedEndDate}`),
                fetch(`http://localhost:3000/material-submit`),
            ]);
            
            if (!materialResponse.ok) throw new Error('Failed to fetch material data');
            if (!priceResponse.ok) throw new Error('Failed to fetch material prices');

            const materialData = await materialResponse.json();
            const priceData = await priceResponse.json();
            console.log('Fetched dailyReport:', materialData);  // Check the output here in the browser console
            console.log('Fetched materialPrice data:', priceData);  // Check the output here in the browser console

            // Filter data to ensure it falls within the selected date range
            const filteredMaterialData = materialData.filter(material => {
                const materialDate = new Date(material.date);
                return materialDate >= new Date(formattedStartDate) && materialDate <= new Date(formattedEndDate);
            });

            if (filteredMaterialData.length === 0) {
                alert('No data found for the selected date range.');
                document.getElementById('materialsTableBody').innerHTML = ''; // Clear existing rows
                hideElement(totalPriceElement);
                hideElement(document.getElementById('content'));
                hideElement(document.getElementById('export'));
                return;
            }

            const combinedData = filteredMaterialData.map(material => {
                const priceItem = priceData.find(p => p.materialName === material.materialName); // Match by materialName
                return {
                    ...material,
                    materialPrice: priceItem ? priceItem.materialPrice : material.materialPrice,
                    laborPrice: priceItem ? priceItem.laborPrice : material.laborPrice,
                    unit: material.unit // Ensure unit is assigned correctly
                };
            });

            // Sum the total price if the same material name exists
            const summedData = combinedData.reduce((acc, item) => {
                const existingItem = acc.find(i => i.materialName === item.materialName);
                if (existingItem) {
                    existingItem.quantity += item.quantity;
                    existingItem.totalPrice += item.totalPrice;
                } else {
                    acc.push(item);
                }
                return acc;
            }, []);

            // Calculate the total price based on the total quantity and prices from the database
            summedData.forEach(item => {
                const priceItem = priceData.find(p => p.materialName === item.materialName); // Match by materialName
                item.totalMaterialPrice = item.quantity * (priceItem ? priceItem.materialPrice : item.materialPrice);
                item.totalLaborPrice = item.quantity * (priceItem ? priceItem.laborPrice : item.laborPrice);
                item.totalPrice = item.totalMaterialPrice + item.totalLaborPrice;
            });

            // Calculate and display the grand total
            const totalMaterialPrice = summedData.reduce((sum, item) => sum + item.totalMaterialPrice, 0).toFixed(2);
            const totalLaborPrice = summedData.reduce((sum, item) => sum + item.totalLaborPrice, 0).toFixed(2);
            const grandTotal = (parseFloat(totalMaterialPrice) + parseFloat(totalLaborPrice)).toFixed(2);
            showElement(totalPriceElement);

            // Display the selected date range
            selectedDateRangeElement.textContent = `From ${formatDate(startDate)} To ${formatDate(endDate)}`;

            // Populate the table with fetched data
            const tbody = document.getElementById('materialsTableBody'); // Use the correct ID for tbody
            tbody.innerHTML = ''; // Clear existing rows
            summedData.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.materialName}</td> 
                    <td>${item.quantity} ${item.unit}</td>
                    <td>${item.totalMaterialPrice.toFixed(2)} €</td>
                    <td>${item.totalLaborPrice.toFixed(2)} €</td>
                    <td>${item.totalPrice.toFixed(2)} €</td>
                `;
                tbody.appendChild(row);
            });

            // Add a row for the grand total at the bottom of the table
            const totalRow = document.createElement('tr');
            totalRow.innerHTML = `
                <td><strong>Total</strong></td>
                <td></td>
                <td><strong>${totalMaterialPrice} €</strong></td>
                <td><strong>${totalLaborPrice} €</strong></td>
                <td><strong>${grandTotal} €</strong></td>
            `;
            tbody.appendChild(totalRow);

            // Show all hidden elements
            showElement(document.getElementById('content'));
            showElement(document.getElementById('export'));

        } catch (error) {
            console.error('Error fetching material data:', error);
            alert('Failed to load material data. Please check the console.');
        }
    });

    // Add event listener to save button
    document.getElementById('save').addEventListener('click', async () => {
        const tableData = [];
        const rows = document.querySelectorAll('#materialsTableBody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length > 0 && cells[0].textContent !== 'Total') { // Exclude the "Total" row
                const quantityUnit = cells[1].textContent.split(' ');
                tableData.push({
                    materialName: cells[0].textContent,
                    quantity: parseFloat(quantityUnit[0]),
                    unit: quantityUnit[1],
                    materialPrice: parseFloat(cells[2].textContent.replace(' €', '')),
                    labourPrice: parseFloat(cells[3].textContent.replace(' €', '')),
                    totalPrice: parseFloat(cells[4].textContent.replace(' €', '')),
                    notes: '' // Add notes field as per schema
                });
            }
        });

        console.log('Table data to be sent:', tableData); // Log the data to be sent

        try {
            // Check if data already exists for the selected date range
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;
            const formattedStartDate = new Date(startDate).toISOString();
            const formattedEndDate = new Date(endDate).toISOString();

            const existingDataResponse = await fetch(`http://localhost:3000/total-price?start=${formattedStartDate}&end=${formattedEndDate}`);
            if (!existingDataResponse.ok) throw new Error('Failed to fetch existing data');

            const existingData = await existingDataResponse.json();
            if (existingData.length > 0) {
                // If data exists, update the existing document with new materials
                const existingDocument = existingData[0];
                const updatedMaterials = [...existingDocument.materials];

                tableData.forEach(newMaterial => {
                    const existingMaterial = updatedMaterials.find(material => material.materialName === newMaterial.materialName);
                    if (existingMaterial) {
                        // Update the existing material
                        existingMaterial.quantity += newMaterial.quantity;
                        existingMaterial.totalPrice += newMaterial.totalPrice;
                    } else {
                        // Add the new material
                        updatedMaterials.push(newMaterial);
                    }
                });

                existingDocument.materials = updatedMaterials;

                const response = await fetch(`http://localhost:3000/total-price/${existingDocument._id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(existingDocument)
                });

                if (!response.ok) throw new Error('Failed to update data');

                alert('Data updated successfully!');
            } else {
                // If no data exists, create a new document
                const response = await fetch('http://localhost:3000/total-price', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        dateRange: { start: formattedStartDate, end: formattedEndDate }, // Include the selected date range
                        materials: tableData
                    })
                });

                if (!response.ok) throw new Error('Failed to save data');

                alert('Data saved successfully!');
            }

            // Store the selected date range in the div with id saved-date
            const savedDateElement = document.getElementById('saved-date');
            savedDateElement.textContent = `Saved Date Range: From ${formatDate(startDate)} To ${formatDate(endDate)}`;
            showElement(savedDateElement);

        } catch (error) {
            console.error('Error saving data:', error);
            alert('Failed to save data. Please check the console.');
        }
    });

    // Add event listener to print button
    document.getElementById('print').addEventListener('click', () => {
        const content = document.getElementById('content').innerHTML;
        const originalContent = document.body.innerHTML;
        document.body.innerHTML = content;
        window.print();
        document.body.innerHTML = originalContent;
        window.location.reload(); // Reload to restore the original content
    });

    // Add event listener to export to PDF button
    document.getElementById('export-pdf').addEventListener('click', () => {
        const element = document.getElementById('content');
        html2pdf().from(element).save('report.pdf');
    });
});