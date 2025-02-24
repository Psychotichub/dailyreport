document.addEventListener('DOMContentLoaded', initStock);

function initStock() {
    const stock = document.getElementById('stock');
    const tbody = document.querySelector('#stock tbody');
    const searchForm = document.getElementById('stock-search');
    const searchInput = document.getElementById('search');
    const searchDropdown = document.createElement('ul');
    searchDropdown.id = 'search-dropdown';
    searchInput.parentNode.appendChild(searchDropdown);

    let totalStockData = [];

    const fetchAllData = async () => {
        try {
            const [dailyReports, receivedMaterials] = await Promise.all([
                fetchAllDailyReport(),
                fetchAllReceived()
            ]);
            totalStockData = calculateTotalStock(dailyReports, receivedMaterials);
            displayTotalStock(totalStockData);
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
        totalStock.sort((a, b) => a.materialName.localeCompare(b.materialName));
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

    const filterStock = (searchTerm) => {
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            const materialName = row.querySelector('td').textContent.toLowerCase();
            if (materialName.includes(searchTerm.toLowerCase())) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    };

    const updateSearchDropdown = (searchTerm) => {
        searchDropdown.innerHTML = '';
        if (searchTerm.length === 0) {
            return;
        }
        const filteredMaterials = totalStockData.filter(({ materialName }) =>
            materialName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        filteredMaterials.forEach(({ materialName }) => {
            const item = document.createElement('li');
            item.textContent = materialName;
            item.addEventListener('click', () => {
                searchInput.value = materialName;
                filterStock(materialName);
                searchDropdown.innerHTML = '';
            });
            searchDropdown.appendChild(item);
        });
    };

    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const searchTerm = searchInput.value.trim();
        filterStock(searchTerm);
    });

    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.trim();
        updateSearchDropdown(searchTerm);
    });

    fetchAllData();
};