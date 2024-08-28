const express = require('express');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const https = require('https');
const url = require('url');

const { createProxyMiddleware } = require('http-proxy-middleware');

function startServer() {
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

// bypass CSP on localhost
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "frame-ancestors 'self' http://localhost:8004;");
  next();
});

app.get('/pdf/:file', (req, res) => {
    const file = req.params.file;
    const pdfPath = path.join(__dirname, 'public/uploads', file);
    
    // Check if the PDF file exists
    fs.access(pdfPath, fs.constants.F_OK, (err) => {
        if (err) {
            return res.status(404).send('PDF file not found');
        } else {
            // If the file exists, serve it embedded in an HTML page
            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>PDF Viewer</title>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.min.js"></script>
                    <style>
                        #pdf-canvas {
                            border: 1px solid black;
                            direction: ltr;
                        }
                        .textLayer {
                            position: absolute;
                            top: 0;
                            left: 0;
                            right: 0;
                            bottom: 0;
                            overflow: hidden;
                            pointer-events: none;
                            font-family: sans-serif;
                            font-size: 10px;
                            transform-origin: 0 0; /* Ensures that scaling occurs from the top-left */
                        }
                    </style>
                </head>
                <body>
                    <div style="position: relative; width: fit-content; margin: auto;">
                        <canvas id="pdf-canvas"></canvas>
                        <div id="pdf-text-layer" class="textLayer"></div>
                    </div>
                    <script>
                        var url = '/uploads/${file}';

                        pdfjsLib.getDocument(url).promise.then(function(pdf) {
                            console.log('PDF loaded');
                            
                            pdf.getPage(1).then(function(page) {
                                console.log('Page loaded');
                                
                                var scale = 1.5;
                                var viewport = page.getViewport({scale: scale});

                                var canvas = document.getElementById('pdf-canvas');
                                var context = canvas.getContext('2d');
                                canvas.height = viewport.height;
                                canvas.width = viewport.width;

                                var renderContext = {
                                    canvasContext: context,
                                    viewport: viewport
                                };
                                var renderTask = page.render(renderContext);

                                renderTask.promise.then(function () {
                                    console.log('Page rendered');

                                    // Now render the text layer
                                    var textLayerDiv = document.getElementById('pdf-text-layer');
                                    textLayerDiv.style.width = canvas.width + 'px';
                                    textLayerDiv.style.height = canvas.height + 'px';
                                    textLayerDiv.style.transform = 'scale(' + scale + ')';
                                    
                                    page.getTextContent().then(function(textContent) {
                                        pdfjsLib.renderTextLayer({
                                            textContent: textContent,
                                            container: textLayerDiv,
                                            viewport: viewport,
                                            textDivs: [],
                                            enhanceTextSelection: true // Optional, improves text selection behavior
                                        }).promise.then(function () {
                                            console.log('Text layer rendered');
                                        });
                                    });
                                });
                            });
                        }).catch(function(error) {
                            console.error('Error loading PDF:', error);
                        });
                    </script>
                </body>
                </html>
            `);
        }
    });
});

        
            

    
    
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


    app.use('/proxy2', async (req, res, next) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).send('URL parameter is required');
    }

    // Ensure the target URL is well-formed
    let formattedTargetUrl = targetUrl;
    if (!/^https?:\/\//i.test(targetUrl)) {
        formattedTargetUrl = `https://${targetUrl}`;
    }

    try {
        const response = await axios.get(formattedTargetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': formattedTargetUrl, // Sometimes needed
                'Origin': 'https://chat.openai.com', // Adjust to your target's origin if needed
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            },
            maxRedirects: 0, // Prevent automatic redirection
            validateStatus: status => status < 400 || status === 308 || status === 403, // Allow 403 responses for handling
        });

        res.send(response.data);
    } catch (error) {
        if (error.response) {
            if (error.response.status === 403) {
                console.error('Proxy error: Request failed with status code 403. Access is forbidden.');
                res.status(403).send('Access forbidden by the target server.');
            } else if (error.response.status === 308) {
                const newUrl = error.response.headers.location;
                console.log(`Redirecting to: ${newUrl}`);
                res.redirect(newUrl);
            } else {
                console.error('Proxy error:', error.message);
                res.status(500).send('Proxy error');
            }
        } else {
            console.error('Proxy error:', error.message);
            res.status(500).send('Proxy error');
        }
    }
    });
app.use('/proxy', (req, res, next) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).send('Missing "url" query parameter');
  }

  const parsedUrl = url.parse(targetUrl);

  const proxy = createProxyMiddleware({
    target: `${parsedUrl.protocol}//${parsedUrl.host}`,
    changeOrigin: true,
    pathRewrite: (path, req) => {
      return path.replace('/proxy', parsedUrl.path || '');
    },
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36');
      proxyReq.setHeader('Accept', '*/*');
      proxyReq.setHeader('Referer', req.headers.referer || targetUrl);

      if (req.headers.cookie) {
        proxyReq.setHeader('Cookie', req.headers.cookie);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      const contentType = proxyRes.headers['content-type'];
      if (contentType && contentType.includes('text/html')) {
        // Log or handle the case where the MIME type is not as expected
        console.warn('Warning: MIME type is text/html, which is not suitable for scripts');
      }
      proxyRes.headers['X-Proxy-By'] = 'YourProxy';  // Custom header
    },
    selfHandleResponse: false,
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.status(500).send('Proxy error');
    },
  });

  proxy(req, res, next);
});
    
    
    
    
    
    // Proxy route to fetch external pages
    app.get('/proxy1', async (req, res) => {
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




// This allows the module to be run from the command line
if (require.main === module) {
    startServer();
}

module.exports = startServer;
