const express = require('express');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const https = require('https');

module.exports = function() {
    const app = express();
    const PORT = process.env.PORT || 8004;

    // Set up storage for multer
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, path.join(__dirname, 'public/uploads/'));
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + path.extname(file.originalname));
        }
    });

    const upload = multer({ storage: storage });

    // Middleware to parse JSON bodies
    app.use(express.json());

    // Serve static files from the 'public' directory
    app.use(express.static(path.join(__dirname, 'public')));

    // Serve the index.html file for the root route
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // Handle file upload
    app.post('/upload', upload.single('image'), (req, res) => {
        if (req.file) {
            console.log(req.file);
            res.json({ status: 'success', filename: req.file.filename });
        } else {
            res.status(400).json({ status: 'fail' });
        }
    });

    // Proxy route to fetch external pages
    app.get('/proxy', async (req, res) => {
        const { url } = req.query;
        if (!url) {
            return res.status(400).send('URL parameter is required');
        }

        try {
            const response = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                httpsAgent: new https.Agent({ rejectUnauthorized: false })
            });

            let html = response.data;
            const baseUrl = new URL(url);

            const script = `
                <script>
                    document.addEventListener("DOMContentLoaded", function() {
                        const base = "${baseUrl.href}";
                        function toAbsoluteUrl(relativeUrl) {
                            return new URL(relativeUrl, base).href;
                        }
                        document.querySelectorAll('a[href], link[href], img[src], script[src], form[action]').forEach(function(element) {
                            if (element.hasAttribute('href')) {
                                element.href = toAbsoluteUrl(element.getAttribute('href'));
                            } else if (element.hasAttribute('src')) {
                                element.src = toAbsoluteUrl(element.getAttribute('src'));
                            } else if (element.hasAttribute('action')) {
                                element.action = toAbsoluteUrl(element.getAttribute('action'));
                            }
                        });
                        const observer = new MutationObserver(function(mutations) {
                            mutations.forEach(function(mutation) {
                                mutation.addedNodes.forEach(function(node) {
                                    if (node.nodeType === 1) { // Element node
                                        if (node.hasAttribute('href')) {
                                            node.href = toAbsoluteUrl(node.getAttribute('href'));
                                        } else if (node.hasAttribute('src')) {
                                            node.src = toAbsoluteUrl(node.getAttribute('src'));
                                        } else if (node.hasAttribute('action')) {
                                            node.action = toAbsoluteUrl(node.getAttribute('action'));
                                        }
                                        node.querySelectorAll('a[href], link[href], img[src], script[src], form[action]').forEach(function(element) {
                                            if (element.hasAttribute('href')) {
                                                element.href = toAbsoluteUrl(element.getAttribute('href'));
                                            } else if (element.hasAttribute('src')) {
                                                element.src = toAbsoluteUrl(element.getAttribute('src'));
                                            } else if (element.hasAttribute('action')) {
                                                element.action = toAbsoluteUrl(element.getAttribute('action'));
                                            }
                                        });
                                    }
                                });
                            });
                        });
                        observer.observe(document.body, { childList: true, subtree: true });
                    });
                </script>
            `;
            html = html.replace('</body>', `${script}</body>`);
            res.send(html);
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

    app.post('/write-file', (req, res) => {
        const { remotePath, fileContent } = req.body;
        if (!remotePath || !fileContent) {
            return res.status(400).send('Missing required fields: remotePath or fileContent');
        }
        const absolutePath = remotePath.replace(/^~(?=$|\/|\\)/, process.env.HOME);
        const dir = path.dirname(absolutePath);
        fs.mkdir(dir, { recursive: true }, (err) => {
            if (err) {
                console.error('Error creating directory:', err);
                return res.status(500).send(`Error creating directory: ${err.message}`);
            }
            fs.writeFile(absolutePath, fileContent, (err) => {
                if (err) {
                    console.error('Error writing file:', err);
                    return res.status(500).send(`Error writing file: ${err.message}`);
                }
                res.send({ message: 'File written successfully' });
            });
        });
    });

    app.get('/get-file', (req, res) => {
        const { filename, content } = req.query;
        if (!filename) {
            return res.status(400).send('Filename parameter is required');
        }
        const filePath = path.join(__dirname, 'public', 'user_files', filename);
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    const fileContent = content || 'This is a new file';
                    fs.writeFile(filePath, fileContent, 'utf8', (writeErr) => {
                        if (writeErr) {
                            return res.status(500).send('Failed to create file');
                        }
                        return res.status(200).send(fileContent);
                    });
                } else {
                    return res.status(500).send('Failed to read file');
                }
            } else {
                return res.status(200).send(data);
            }
        });
    });

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

