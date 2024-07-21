const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8004;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the index.html file for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Proxy route to fetch external pages
app.get('/proxy', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).send('URL parameter is required');
    }

    try {
        const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        res.send(response.data);
    } catch (error) {
        console.error('Error fetching URL:', error);
        res.status(500).send('Failed to fetch URL');
    }
});

// Route to handle POST request and create a file
app.post('/create-file', (req, res) => {
    const { filename, content } = req.body;

    if (!filename || !content) {
        return res.status(400).send('Filename and content are required');
    }

    const filePath = path.join(__dirname, 'public', 'user_files', filename);

    fs.writeFile(filePath, content, (err) => {
        if (err) {
            console.error('Error writing file:', err);
            return res.status(500).send('Failed to create file');
        }

        res.status(200).send('File created successfully');
    });
});




app.get('/get-file', (req, res) => {
    const { filename, content } = req.query;

    if (!filename) {
        console.error('Filename parameter is required');
        return res.status(400).send('Filename parameter is required');
    }

    const filePath = path.join(__dirname, 'public', 'user_files', filename);

    console.log(`Requested file: ${filePath}`);

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // File does not exist, create it with provided content
                const fileContent = content || 'This is a new file'; // Default content if none provided
                console.log(`File not found. Creating new file: ${filePath} with content: "${fileContent}"`);
                
                fs.writeFile(filePath, fileContent, 'utf8', (writeErr) => {
                    if (writeErr) {
                        console.error('Error creating file:', writeErr);
                        return res.status(500).send('Failed to create file');
                    }

                    console.log(`File created successfully: ${filePath}`);
                    return res.status(200).send(fileContent);
                });
            } else {
                console.error('Error reading file:', err);
                return res.status(500).send('Failed to read file');
            }
        } else {
            console.log(`File read successfully: ${filePath}`);
            return res.status(200).send(data);
        }
    });
});



// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



