document.addEventListener('DOMContentLoaded', initTotalPrice);
async function initTotalPrice() {
    const totalPriceElement = document.getElementById('grand-total');
    const startDateInput = document.getElementById('startDateInput');
    const endDateInput = document.getElementById('endDateInput');
    const fetchButton = document.getElementById('fetchButton');
    const selectedDateRangeElement = document.getElementById('selected-date-range');

    const showElement = (element) => element.classList.remove('hidden');
    const hideElement = (element) => element.classList.add('hidden');

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-CA').split('T')[0];
    };

    const currentDate = new Date().toLocaleDateString('en-CA').split('T')[0];
    startDateInput.value = currentDate;
    endDateInput.value = currentDate;

    let selectedUnit = '';
    hideElement(document.getElementById('content'));

    fetchButton.addEventListener('click', async () => {
        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);
        endDate.setHours(23, 59, 59, 999);

        try {
            const formattedStartDate = startDate.toLocaleDateString('en-CA');
            const formattedEndDate = endDate.toLocaleDateString('en-CA');

            const [materialResponse, priceResponse] = await Promise.all([
                fetch(`/daily-reports/date-range?start=${formattedStartDate}&end=${formattedEndDate}`),
                fetch(`/material-submit`),
            ]);

            if (!materialResponse.ok) throw new Error('Failed to fetch material data');
            if (!priceResponse.ok) throw new Error('Failed to fetch material prices');

            const materialData = await materialResponse.json();
            const priceData = await priceResponse.json();

            // Sort materialData and priceData alphabetically by materialName
            materialData.sort((a, b) => a.materialName.localeCompare(b.materialName));
            priceData.sort((a, b) => a.materialName.localeCompare(b.materialName));

            if (materialData.length === 0) {
                alert('No data found for the selected date range.');
                return;
            }

            const combinedData = materialData.map(material => {
                const priceItem = priceData.find(p => p.materialName === material.materialName);
                return {
                    ...material,
                    materialPrice: priceItem ? priceItem.materialPrice : material.materialPrice,
                    laborPrice: priceItem ? priceItem.laborPrice : material.laborPrice,
                    unit: material.unit
                };
            });

            const summedData = combinedData.reduce((acc, item) => {
                const existingItem = acc.find(i => i.materialName === item.materialName);
                if (existingItem) {
                    existingItem.quantity += item.quantity;
                } else {
                    acc.push(item);
                }
                return acc;
            }, []);

            summedData.forEach(item => {
                const priceItem = priceData.find(p => p.materialName === item.materialName);
                item.totalMaterialPrice = item.quantity * (priceItem ? priceItem.materialPrice : item.materialPrice);
                item.totalLaborPrice = item.quantity * (priceItem ? priceItem.laborPrice : item.laborPrice);
                item.totalPrice = item.totalMaterialPrice + item.totalLaborPrice;
            });

            const totalMaterialPrice = summedData.reduce((sum, item) => sum + item.totalMaterialPrice, 0).toFixed(2);
            const totalLaborPrice = summedData.reduce((sum, item) => sum + item.totalLaborPrice, 0).toFixed(2);
            const grandTotal = (parseFloat(totalMaterialPrice) + parseFloat(totalLaborPrice)).toFixed(2);
            showElement(totalPriceElement);

            selectedDateRangeElement.textContent = `Selected Date Range: ${formatDate(startDate)} to ${formatDate(endDate)}`;

            const tbody = document.getElementById('materialsTableBody');
            tbody.innerHTML = '';
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

            const totalRow = document.createElement('tr');
            totalRow.innerHTML = `
                <td><strong>Total</strong></td>
                <td></td>
                <td><strong>${totalMaterialPrice} €</strong></td>
                <td><strong>${totalLaborPrice} €</strong></td>
                <td><strong>${grandTotal} €</strong></td>
            `;
            tbody.appendChild(totalRow);

            showElement(document.getElementById('content'));
            showElement(document.getElementById('export'));

        } catch (error) {
            console.error('Error fetching material data:', error);
            alert('Failed to load material data. Please check the console.');
        }
    });

    document.getElementById('save').addEventListener('click', async () => {
        const tableData = [];
        const rows = document.querySelectorAll('#materialsTableBody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length > 0 && cells[0].textContent !== 'Total') {
                const quantityUnit = cells[1].textContent.split(' ');
                tableData.push({
                    materialName: cells[0].textContent,
                    quantity: parseFloat(quantityUnit[0]),
                    unit: quantityUnit[1],
                    materialPrice: parseFloat(cells[2].textContent.replace(' €', '')),
                    laborPrice: parseFloat(cells[3].textContent.replace(' €', '')),
                    totalPrice: parseFloat(cells[4].textContent.replace(' €', '')),
                    date: new Date().toLocaleDateString('en-CA').split('T')[0],
                    dateRange: `${formatDate(startDateInput.value)} to ${formatDate(endDateInput.value)}`
                });
            }
        });

        const dateRange = `${formatDate(startDateInput.value)} to ${formatDate(endDateInput.value)}`;

        try {
            const checkResponse = await fetch(`/total-price/date-range?dateRange=${encodeURIComponent(dateRange)}`);
            if (!checkResponse.ok) throw new Error('Failed to check date range');
            const checkData = await checkResponse.json();

            if (checkData.exists) {
                alert('Data for the selected date range already exists.');
                return;
            }

            const response = await fetch('/total-price', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ materials: tableData })
            });

            if (!response.ok) throw new Error('Failed to save data');

            alert('Data saved successfully!');
        } catch (error) {
            console.error('Error saving data:', error);
            alert('Failed to save data. Please check the console.');
        }
    });
};