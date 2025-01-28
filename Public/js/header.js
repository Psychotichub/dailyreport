document.addEventListener("DOMContentLoaded", function() {
    fetch('/html/header.html') // Ensure this path is correct
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;
        })
        .catch(error => console.error('Error fetching header:', error));
});

function displayCurrentDateTime() {
    const dateContainer = document.getElementById("date-time");
    const now = new Date();
    const formattedDate = now.toISOString().split('T')[0]; // Format date as yyyy-mm-dd
    const formattedTime = now.toLocaleTimeString();
    dateContainer.innerHTML += `<p>${formattedDate}, ${formattedTime}</p>`;
}