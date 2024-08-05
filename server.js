const express = require('express');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');


const app = express();
const PORT = process.env.PORT || 8004;

// Set up storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
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
	console.log(req.file)
      res.json({ status: 'success', filename: req.file.filename });
  } else {
    res.status(400).json({ status: 'fail' });
  }
});

// Proxy route to fetch external pages
// This has problems with relative URLS TODO FIX
/*app.get('/proxy', async (req, res) => {
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
*/



app.get('/proxy', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).send('URL parameter is required');
    }

    try {
        const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        let html = response.data;

        // Base URL
        const baseUrl = new URL(url);

        // Inject JavaScript to modify URLs
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

        // Inject the script before closing </body> tag
        html = html.replace('</body>', `${script}</body>`);

        res.send(html);
    } catch (error) {
        console.error('Error fetching URL:', error);
        res.status(500).send('Failed to fetch URL');
    }
});



/*
app.get('/proxy', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).send('URL parameter is required');
    }

    try {
        const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        let html = response.data;

        // Convert relative URLs to absolute URLs
        const baseUrl = new URL(url);

        // Handle href attributes in a, link, etc.
        html = html.replace(/(href=")([^http][^"]*)"/g, (match, p1, p2) => `${p1}${new URL(p2, baseUrl).href}"`);

        // Handle src attributes in img, script, etc.
        html = html.replace(/(src=")([^http][^"]*)"/g, (match, p1, p2) => `${p1}${new URL(p2, baseUrl).href}"`);

        // Handle action attributes in form tags
        html = html.replace(/(action=")([^http][^"]*)"/g, (match, p1, p2) => `${p1}${new URL(p2, baseUrl).href}"`);
        
        // Send the modified HTML back
        res.send(html);
    } catch (error) {
        console.error('Error fetching URL:', error);
        res.status(500).send('Failed to fetch URL');
    }
});
*/


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


/*
app.post('/run-command', (req, res) => {
  const { ip, port = 22, username, password, command } = req.body; // Default to port 22 if not provided

  if (!ip || !username || !password || !command) {
    return res.status(400).send('Missing required fields: ip, username, password, or command');
  }

  const conn = new Client();

  const config = {
    host: ip,
    port: port,
    username: username,
    password: password
  };

  conn.on('ready', () => {
    console.log('Client :: ready');
    conn.exec(command, (err, stream) => {
      if (err) {
        conn.end();
        return res.status(500).send(`Error executing command: ${err.message}`);
      }

      let stdout = '';
      let stderr = '';

      stream.on('close', (code, signal) => {
        console.log(`Stream :: close :: code: ${code}, signal: ${signal}`);
        conn.end();
        res.send({ code, signal, stdout, stderr });
      }).on('data', (data) => {
        stdout += data;
      }).stderr.on('data', (data) => {
        stderr += data;
      });
    });
  }).connect(config);
});

*/








app.post('/write-file', (req, res) => {
  const { remotePath, fileContent } = req.body;

  if (!remotePath || !fileContent) {
    return res.status(400).send('Missing required fields: remotePath or fileContent');
  }

  const absolutePath = remotePath.replace(/^~(?=$|\/|\\)/, process.env.HOME);
  const dir = path.dirname(absolutePath);

  console.log(`Creating directory: ${dir}`);

  // Create directories recursively
  fs.mkdir(dir, { recursive: true }, (err) => {
    if (err) {
      console.error('Error creating directory:', err);
      return res.status(500).send(`Error creating directory: ${err.message}`);
    }

    console.log(`Writing file to ${absolutePath}`);

    // Write the file
    fs.writeFile(absolutePath, fileContent, (err) => {
      if (err) {
        console.error('Error writing file:', err);
        return res.status(500).send(`Error writing file: ${err.message}`);
      }

      console.log('File written successfully');
      res.send({ message: 'File written successfully' });
    });
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



