document.addEventListener('DOMContentLoaded', initStock);

function initStock() {
    const stock = document.getElementById('stock');
    const tbody = document.querySelector('#stock tbody');

    const fetchAllData = async () => {
        try {
            const [dailyReports, receivedMaterials] = await Promise.all([
                fetchAllDailyReport(),
                fetchAllReceived()
            ]);
            const totalStock = calculateTotalStock(dailyReports, receivedMaterials);
            displayTotalStock(totalStock);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const fetchAllDailyReport = async () => {
        try {
            const response = await fetch('/daily-reports');

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            return data;

        } catch (error) {
            return [];
        }
    };

    const fetchAllReceived = async () => {
        try {
            const response = await fetch('/received');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            return data;

        } catch (error) {
            return [];
        }
    };

    const calculateTotalStock = (dailyReports, receivedMaterials) => {
        const stockMap = new Map();

        receivedMaterials.forEach(received => {
            const { materialName, quantity, unit } = received;
            if (stockMap.has(materialName)) {
                const stock = stockMap.get(materialName);
                stock.received += quantity;
                stockMap.set(materialName, stock);
            } else {
                stockMap.set(materialName, { received: quantity, consumed: 0, unit: unit });
            }
        });

        dailyReports.forEach(report => {
            const { materialName, quantity, unit } = report;
            if (stockMap.has(materialName)) {
                const stock = stockMap.get(materialName);
                stock.consumed += quantity;
                stockMap.set(materialName, stock);
            } else {
                stockMap.set(materialName, { received: 0, consumed: quantity, unit: unit });
            }
        });

        return Array.from(stockMap, ([materialName, { received, consumed, unit }]) => ({
            materialName,
            received,
            consumed,
            unit,
            total: received - consumed
        }));
    };

    const displayTotalStock = (totalStock) => {
        tbody.innerHTML = '';
        const displayedMaterials = new Set();
        totalStock.forEach(({ materialName, received, consumed, unit, total }) => {
            if (!displayedMaterials.has(materialName)) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${materialName}</td>
                    <td>${received} ${unit}</td>
                    <td>${consumed} ${unit}</td>
                    <td>${total} ${unit}</td>
                `;
                tbody.appendChild(row);
                displayedMaterials.add(materialName);
            }
        });
    };
    fetchAllData();
};