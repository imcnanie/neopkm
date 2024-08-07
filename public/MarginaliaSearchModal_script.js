// MarginaliaSearchModal_script.js
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('MarginaliaSearchModal');
    const span = modal.getElementsByClassName('MarginaliaSearchModal_close')[0];
    const searchButton = document.getElementById('MarginaliaSearchModal_searchButton');
    const searchInput = document.getElementById('MarginaliaSearchModal_searchInput');
    const resultsContainer = document.getElementById('MarginaliaSearchModal_results');

    // Show modal on Ctrl+Shift+M
    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.shiftKey && event.key === 'P') {
            modal.style.display = 'block';
        }
    });

    // Close modal
    span.onclick = function() {
        modal.style.display = 'none';
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

    // Search Marginalia
    searchButton.onclick = function() {
        const query = searchInput.value;
        searchMarginalia(query);
    }

    // Marginalia API call
    function searchMarginalia(query) {
        const apiKey = 'testing1234'; // Replace with your own API key if needed
        const apiURL = `/proxy?url=https://api.marginalia.nu/${apiKey}/search/${query}`;

        fetch(apiURL)
            .then(response => response.json())
            .then(data => {
                resultsContainer.innerHTML = '';
                if (data.error) {
                    resultsContainer.innerHTML = `<p class="MarginaliaSearchModal_error">Error: ${data.error}</p>`;
                } else {
                    data.results.forEach(result => {
                        const resultItem = document.createElement('div');
                        resultItem.className = 'MarginaliaSearchModal_result-item';
                        resultItem.innerHTML = `
                            <div>
                                <h3>${result.title}</h3>
                                <p>${result.description}</p>
                                <a href="${result.url}" target="_blank">View</a>
                            </div>
                        `;
                        resultsContainer.appendChild(resultItem);
                    });
                }
            })
            .catch(error => {
                resultsContainer.innerHTML = `<p class="MarginaliaSearchModal_error">Error fetching results: ${error.message}</p>`;
            });
    }
});
