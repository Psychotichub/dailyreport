document.addEventListener('DOMContentLoaded', initTotalPrice);
async function initTotalPrice() {
    const dateRange = document.getElementById('date-range');
    const monthlyReport = document.getElementById('monthly-report').querySelector('tbody');
    const monthlyReportTable = document.getElementById('monthly-report');
    const showDate= document.getElementById('date');
    const printButton = document.getElementById('print');
    const exportExcelButton = document.getElementById('export');
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
        exportExcelButton.style.display = 'none';
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
                exportExcelButton.style.display = 'none';
            } else {
                monthlyReportTable.style.display = 'table';
                printButton.style.display = 'inline-block';
                exportExcelButton.style.display = 'inline-block';
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
        const printWindow = window.open('', '_blank', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Preview</title>');
        printWindow.document.write('<style>');
        printWindow.document.write('table { border: 1px solid black; border-collapse: collapse; }');
        printWindow.document.write('th, td { border: 1px solid black; padding: 8px; }');
        printWindow.document.write('</style></head><body>');
        printWindow.document.write(element.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    };

    const exportToExcel = () => {
        const table = document.getElementById('monthly-report').querySelector('table');
        if (!table) return;

        const dateHeader = document.getElementById('date').textContent;
        const fileName = `Monthly_Report_${dateHeader.replace('Situation for Date: ', '')}.xlsx`;
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.table_to_sheet(table);

        // Set column widths
        const columnWidths = [
            { wch: 30 }, // Material Name
            { wch: 15 }, // Quantity
            { wch: 15 }, // Material Price
            { wch: 15 }, // Labor Price
            { wch: 15 }  // Total Price
        ];
        ws['!cols'] = columnWidths;

        // Apply styles to the worksheet
        // Get all cells in the worksheet
        const range = XLSX.utils.decode_range(ws['!ref']);

        // Define styles
        const headerStyle = {
            fill: { fgColor: { rgb: "003366" } },
            font: { color: { rgb: "FFFFFF" }, bold: true, sz: 11 },
            alignment: { horizontal: "left" }
        };

        const evenRowStyle = {
            fill: { fgColor: { rgb: "F1F6FB" } },
            font: { color: { rgb: "000000" }, sz: 10 },
            alignment: { horizontal: "left" }
        };

        const oddRowStyle = {
            fill: { fgColor: { rgb: "FFFFFF" } },
            font: { color: { rgb: "000000" }, sz: 10 },
            alignment: { horizontal: "left" }
        };

        const totalRowStyle = {
            font: { bold: true, sz: 10 },
            alignment: { horizontal: "left" }
        };

        const materialNameStyle = {
            font: { bold: true, sz: 10 },
            alignment: { horizontal: "left" }
        };

        const totalPriceStyle = {
            font: { color: { rgb: "D32F2F" }, bold: true, sz: 10 },
            alignment: { horizontal: "left" }
        };

        // Apply styles to cells
        for (let row = range.s.r; row <= range.e.r; row++) {
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                if (!ws[cellAddress]) continue;

                // Initialize cell style if not exists
                if (!ws[cellAddress].s) ws[cellAddress].s = {};

                // Apply header style to the first row
                if (row === 0) {
                    ws[cellAddress].s = headerStyle;
                }
                // Apply total row style to the last row
                else if (row === range.e.r) {
                    ws[cellAddress].s = totalRowStyle;

                    // Special style for total price cell
                    if (col === 4) {
                        ws[cellAddress].s = { ...totalRowStyle, ...totalPriceStyle };
                    }
                }
                // Apply alternating row styles
                else {
                    if (row % 2 === 0) {
                        ws[cellAddress].s = evenRowStyle;
                    } else {
                        ws[cellAddress].s = oddRowStyle;
                    }

                    // Apply special styles for specific columns
                    if (col === 0) {
                        ws[cellAddress].s = { ...(row % 2 === 0 ? evenRowStyle : oddRowStyle), ...materialNameStyle };
                    } else if (col === 4) {
                        ws[cellAddress].s = { ...(row % 2 === 0 ? evenRowStyle : oddRowStyle), ...totalPriceStyle };
                    }
                }
            }
        }

        // Add the worksheet to the workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Monthly Report');

        // Generate the Excel file and trigger download
        XLSX.writeFile(wb, fileName);
    };

    printButton.addEventListener('click', () => {
        printElement(monthlyReportDiv);
    });

    exportExcelButton.addEventListener('click', exportToExcel);

    fetchData();
};
