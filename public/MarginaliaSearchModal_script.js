// MarginaliaSearchModal_script.js
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('MarginaliaSearchModal');
    const span = modal.getElementsByClassName('MarginaliaSearchModal_close')[0];
    const searchButton = document.getElementById('MarginaliaSearchModal_searchButton');
    const searchInput = document.getElementById('MarginaliaSearchModal_searchInput');
    const resultsContainer = document.getElementById('MarginaliaSearchModal_results');
    const apiKeyInput = document.getElementById('MarginaliaSearchModal_apiKeyInput');
    const apiKeyError = document.getElementById('MarginaliaSearchModal_apiKeyError');


    // Show modal on Ctrl+Shift+M
    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.shiftKey && event.key === 'P') {
            modal.style.display = 'block';
	    const storedApiKey = localStorage.getItem('marginaliaApiKey');
            if (storedApiKey) {
                apiKeyInput.value = storedApiKey;
            }
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

    // Save API key on input change
    apiKeyInput.addEventListener('input', function() {
        const apiKey = apiKeyInput.value;
        if (apiKey) {
            localStorage.setItem('marginaliaApiKey', apiKey);
            apiKeyError.style.display = 'none';
        }
    });


    // Search Marginalia
    searchButton.onclick = function() {
        const query = searchInput.value;
        searchMarginalia(query);
    }

    // Marginalia API call
    function searchMarginalia(query) {
        const apiKey = localStorage.getItem('marginaliaApiKey');
	
	if (apiKey) {

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

	} else {
            apiKeyError.textContent = 'Sorry, you need an API Key to search YouTube.';
            apiKeyError.style.display = 'block';
	}
	
    }
});
