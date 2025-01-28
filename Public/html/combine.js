// Fetch and display data based on date range
fetchButton.addEventListener('click', async () => {
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    try {
        const [materialResponse, quantityResponse] = await Promise.all([
            fetch(`http://localhost:3000/material-submit?start=${startDate}&end=${endDate}`),
            fetch(`http://localhost:3000/quantity-submit?start=${startDate}&end=${endDate}`)
        ]);

        if (!materialResponse.ok) throw new Error('Failed to fetch material data');
        if (!quantityResponse.ok) throw new Error('Failed to fetch quantity data');

        const materialData = await materialResponse.json();
        const quantityData = await quantityResponse.json();
        console.log('Fetched material data:', materialData);
        console.log('Fetched quantity data:', quantityData);

        // Combine material data with quantity data
        const combinedData = materialData.map(material => {
            const quantityItem = quantityData.find(q => q.materialId === material.materialId);
            return {
                ...material,
                quantity: quantityItem ? quantityItem.quantity : material.quantity,
                unit: quantityItem ? quantityItem.unit : material.unit
            };
        });

        // Populate the table with combined data
        const tbody = document.getElementById('materialsTableBody'); // Use the correct ID for tbody
        tbody.innerHTML = ''; // Clear existing rows
        combinedData.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.materialName}</td> 
                <td>${item.quantity} ${item.unit}</td>
                <td>${item.materialPrice} €</td>
                <td>${item.laborPrice} €</td>
                <td>${item.totalPrice} €</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching data:', error);
    }
});