// YoutubeSearchModal_script.js
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('YoutubeSearchModal_videoModal');
    const span = document.getElementsByClassName('YoutubeSearchModal_close')[0];
    const searchButton = document.getElementById('YoutubeSearchModal_searchButton');
    const searchInput = document.getElementById('YoutubeSearchModal_searchInput');
    const videoResults = document.getElementById('YoutubeSearchModal_videoResults');
    const apiKeyInput = document.getElementById('YoutubeSearchModal_apiKeyInput');
    const apiKeyError = document.getElementById('YoutubeSearchModal_apiKeyError');

    // Show modal on Ctrl+Shift+Y
    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.shiftKey && event.key === 'Y') {
            modal.style.display = 'block';
            const storedApiKey = localStorage.getItem('YoutubeSearchModal_youtubeApiKey');
            if (storedApiKey) {
                apiKeyInput.value = storedApiKey;
            }
	    searchInput.focus();  // Set focus to the search input
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
            localStorage.setItem('YoutubeSearchModal_youtubeApiKey', apiKey);
            apiKeyError.style.display = 'none';
        }
    });

    // Search videos
    /*searchButton.onclick = function() {
        const query = searchInput.value;
        const apiKey = localStorage.getItem('YoutubeSearchModal_youtubeApiKey');
        if (apiKey) {
            searchYouTube(query, apiKey);
        } else {
            apiKeyError.textContent = 'Sorry, you need an API Key to search YouTube.';
            apiKeyError.style.display = 'block';
        }
	}*/
    // Function to handle search action
    function handleSearch() {
	const query = searchInput.value;
	const apiKey = localStorage.getItem('YoutubeSearchModal_youtubeApiKey');
	if (apiKey) {
            searchYouTube(query, apiKey);
	} else {
            apiKeyError.textContent = 'Sorry, you need an API Key to search YouTube.';
            apiKeyError.style.display = 'block';
	}
    }
    
    // Event listener for the search button click
    searchButton.onclick = handleSearch;
    
    // Event listener for the Enter key press in the search input field
    YoutubeSearchModal_searchInput.addEventListener('keydown', function(event) {
	if (event.key === 'Enter') {
            handleSearch();
	}
    });

    // YouTube API call
    function searchYouTube(query, apiKey) {
        const apiURL = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${query}&key=${apiKey}`;

        fetch(apiURL)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    apiKeyError.textContent = 'Invalid API Key.';
                    apiKeyError.style.display = 'block';
                } else {
                    videoResults.innerHTML = '';
                    data.items.forEach(item => {
                        const videoItem = document.createElement('div');
                        videoItem.className = 'YoutubeSearchModal_video-item';
                        videoItem.innerHTML = `
                            <img src="${item.snippet.thumbnails.default.url}" alt="${item.snippet.title}">
                            <div>
                                <h3>${item.snippet.title}</h3>
                                <p>${item.snippet.description}</p>
                                <button class="YoutubeSearchModal_add-video YoutubeSearchModal_button">Add Video</button>
                            </div>
                        `;
                        videoItem.querySelector('.YoutubeSearchModal_add-video').onclick = function() {
                            //console.log(`Title: ${item.snippet.title}`);
                            //console.log(`URL: https://www.youtube.com/watch?v=${item.id.videoId}`);
                            //console.log(`Description: ${item.snippet.description}`);
			    console.log(item);
			    createNodeAndLink(currentNode.id, currentNode.x_positions[0], currentNode.y_positions[0] + 30,
					      item.snippet.title, `https://www.youtube.com/watch?v=${item.id.videoId}`, item.snippet.thumbnails.default.url);
			    //modal.style.display = 'none';
                        };
                        videoResults.appendChild(videoItem);
                    });
                }
            })
            .catch(error => {
                apiKeyError.textContent = 'Error fetching YouTube videos.';
                apiKeyError.style.display = 'block';
                console.error('Error fetching YouTube videos:', error);
            });
    }
});

