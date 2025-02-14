document.addEventListener("DOMContentLoaded", function() {
    fetch('/html/header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;
            displayCurrentDateTime();
        })
        .catch(error => console.error('Error fetching header:', error));
});

function displayCurrentDateTime() {
    const dateContainer = document.getElementById("date-time");
    const now = new Date();
    const formattedDate = now.toLocaleDateString('sv-SE');
    const formattedTime = now.toLocaleTimeString('sv-SE');
    dateContainer.innerHTML += `<p>Now: ${formattedDate}, ${formattedTime}</p>`;
}