document.addEventListener('DOMContentLoaded', initTotalPrice);
async function initTotalPrice() {
    const dateRange = document.getElementById('date-range');
    const monthlyReport = document.getElementById('monthly-report').querySelector('tbody');
    const monthlyReportTable = document.getElementById('monthly-report');
    const showDate= document.getElementById('date');
    const printButton = document.getElementById('print');
    const exportPdfButton = document.getElementById('export-pdf');
    const monthlyReportDiv = document.getElementById('monthly-report');

    const displayData = (data) => {
        dateRange.innerHTML = '';
        const uniqueDateRanges = new Set();
        data.forEach(item => {
            if (!uniqueDateRanges.has(item.dateRange)) {
                uniqueDateRanges.add(item.dateRange);
                const row = document.createElement('tr');
                row.innerHTML = `<td>${item.dateRange}</td>`;

                const dateDiv = document.createElement('div');
                dateDiv.innerHTML = `Date: ${item.dateRange}`;
                dateDiv.classList.add('clickable-date-range');
                dateDiv.addEventListener('click', () => displayReportForDateRange(item.dateRange));
                dateRange.appendChild(dateDiv);
            }
        });

        monthlyReportTable.style.display = 'none';
        printButton.style.display = 'none';
        exportPdfButton.style.display = 'none';
    };

    const displayReportForDateRange = async (selectedDateRange) => {
        try {
            const response = await fetch(`/total-price?dateRange=${selectedDateRange}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            monthlyReport.innerHTML = '';
            showDate.innerHTML = `Situation for Date: ${selectedDateRange}`;
            let totalSum = 0;
            let totalMaterialPrice = 0;
            let totalLaborPrice = 0;
            data.forEach(item => {
                if (item.dateRange === selectedDateRange) {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${item.materialName} </td>
                        <td>${item.quantity} ${item.unit}</td>
                        <td>${item.materialPrice} €</td>
                        <td>${item.laborPrice} €</td>
                        <td>${item.totalPrice} €</td>
                    `;
                    monthlyReport.appendChild(row);
                    totalSum += item.totalPrice;
                    totalMaterialPrice += item.materialPrice;
                    totalLaborPrice += item.laborPrice;
                }
            });

            const totalRow = document.createElement('tr');
            totalRow.innerHTML = `
                <td><strong>Total</strong></td>
                <td></td>
                <td><strong>${totalMaterialPrice.toFixed(2)} €</strong></td>
                <td><strong>${totalLaborPrice.toFixed(2)} €</strong></td>
                <td><strong>${totalSum.toFixed(2)} €</strong></td>
            `;
            monthlyReport.appendChild(totalRow);

            if (data.length === 0) {
                monthlyReportTable.style.display = 'none';
                printButton.style.display = 'none';
                exportPdfButton.style.display = 'none';
            } else {
                monthlyReportTable.style.display = 'table';
                printButton.style.display = 'inline-block';
                exportPdfButton.style.display = 'inline-block';
            }
        } catch (error) {
            console.error('There has been a problem with your fetch operation:', error);
        }
    };

    const fetchData = async () => {
        try {
            const response = await fetch('/total-price');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            displayData(data);
        } catch (error) {
            console.error('There has been a problem with your fetch operation:', error);
        }
    };

    const printElement = (element) => {
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Print</title>');
        printWindow.document.write('<style>');
        printWindow.document.write('table { border: 1px solid black; border-collapse: collapse; }');
        printWindow.document.write('th, td { border: 1px solid black; padding: 8px; }');
        printWindow.document.write('</style></head><body>');
        printWindow.document.write(element.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    };

    printButton.addEventListener('click', () => {
        printElement(monthlyReportDiv);
    });

    fetchData();
};
