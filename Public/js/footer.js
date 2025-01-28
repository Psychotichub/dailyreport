document.addEventListener("DOMContentLoaded", function() {
    fetch('/html/footer.html') // Ensure this path is correct
        .then(response => response.text())
        .then(data => {
            document.getElementById('footer-placeholder').innerHTML = data;
        })
        .catch(error => console.error('Error fetching footer:', error));
});