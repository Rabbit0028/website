const express = require('express');
const path = require('path');
const app = express();

// Serve static files (e.g., logo, CKEditor folder) from "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Parse form data from HTML forms
app.use(express.urlencoded({ extended: true }));

// In-memory storage for articles
let articles = [];
let nextId = 1; // Used to assign unique IDs to articles

// A helper function to wrap pages in a consistent layout
function renderLayout(content, extraScripts = '') {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>NFL Media Here and Now</title>
    <link href="https://fonts.googleapis.com/css?family=Roboto:400,700" rel="stylesheet">
    <style>
      body {
        font-family: 'Roboto', sans-serif;
        margin: 0;
        padding: 0;
        background: #eaeaea;
      }
      header {
        background: linear-gradient(90deg, #003366, #0055a5);
        color: white;
        padding: 20px 0;
        text-align: center;
      }
      .logo-container {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 10px;
      }
      .logo {
        width: 200px;
        height: auto;
      }
      nav {
        background: #003366;
        padding: 10px;
        text-align: center;
      }
      nav a {
        color: white;
        text-decoration: none;
        margin: 0 15px;
        font-weight: bold;
      }
      .container {
        max-width: 800px;
        margin: 20px auto;
        padding: 20px;
        background: white;
        border-radius: 5px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .article {
        border-bottom: 1px solid #ddd;
        padding: 15px 0;
      }
      .article:last-child {
        border-bottom: none;
      }
      .article-actions {
        margin-top: 10px;
      }
      .article-actions a, .article-actions form {
        display: inline-block;
        margin-right: 10px;
      }
      .article-actions button {
        background: #c00;
        color: #fff;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
      }
      .article-actions button:hover {
        background: #900;
      }
      form {
        display: flex;
        flex-direction: column;
      }
      form label {
        margin-top: 10px;
        font-weight: bold;
      }
      form input[type="text"],
      form textarea {
        padding: 10px;
        margin-top: 5px;
        border: 1px solid #ccc;
        border-radius: 4px;
      }
      form button {
        margin-top: 20px;
        padding: 10px;
        background: #0055a5;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
      }
      form button:hover {
        background: #003366;
      }
    </style>
  </head>
  <body>
    <header>
      <div class="logo-container">
        <!-- Example: Place your logo image in the public folder -->
        <img class="logo" src="/logo.webp" alt="NFL Sports Media Logo">
      </div>
      <h1>NFL Media Here and Now</h1>
    </header>
    <nav>
      <a href="/">Home</a>
      <a href="/add">Add Article</a>
    </nav>
    <div class="container">
      ${content}
    </div>
    ${extraScripts}
  </body>
  </html>
  `;
}

// Home Page: Display All Articles
app.get('/', (req, res) => {
  let content = `<h2>Latest Articles</h2>`;

  if (articles.length === 0) {
    content += `<p>No articles available. <a href="/add">Add an article</a>.</p>`;
  } else {
    articles.forEach(article => {
      content += `
        <div class="article">
          <h3>${article.title}</h3>
          <div>${article.content}</div>
          <div class="article-actions">
            <a href="/edit/${article.id}">Edit</a>
            <form action="/delete/${article.id}" method="POST" style="display:inline;">
              <button type="submit">Delete</button>
            </form>
          </div>
        </div>
      `;
    });
  }

  res.send(renderLayout(content));
});

// Add Article: Show Form
app.get('/add', (req, res) => {
  const content = `
    <h2>Add a New Article</h2>
    <p>
      Use the editor below to format your text (bold, italics, headings, lists, etc.).
    </p>
    <form method="POST" action="/add">
      <label for="title">Title:</label>
      <input type="text" name="title" id="title" required />

      <label for="content">Content:</label>
      <textarea name="content" id="content" rows="5" required></textarea>

      <button type="submit">Submit</button>
    </form>
  `;

  // Note: we load CKEditor from our local folder: /ckeditor/ckeditor.js
  // This folder is the unzipped CKEditor content inside "public/ckeditor"
  const extraScripts = `
    <script src="/ckeditor/ckeditor.js"></script>
    <script>
      CKEDITOR.replace('content');
    </script>
  `;

  res.send(renderLayout(content, extraScripts));
});

// Add Article: Handle Submission
app.post('/add', (req, res) => {
  const { title, content } = req.body;
  articles.push({ id: nextId++, title, content });
  res.redirect('/');
});

// Edit Article: Show Form
app.get('/edit/:id', (req, res) => {
  const articleId = parseInt(req.params.id, 10);
  const article = articles.find(a => a.id === articleId);

  if (!article) {
    return res.status(404).send(renderLayout('<h2>Article not found</h2>'));
  }

  const content = `
    <h2>Edit Article</h2>
    <form method="POST" action="/edit/${article.id}">
      <label for="title">Title:</label>
      <input type="text" name="title" id="title" value="${article.title}" required />

      <label for="content">Content:</label>
      <textarea name="content" id="content" rows="5" required>${article.content}</textarea>

      <button type="submit">Update</button>
    </form>
  `;

  const extraScripts = `
    <script src="/ckeditor/ckeditor.js"></script>
    <script>
    CKEDITOR.replace('content');
    </script>

  `;

  res.send(renderLayout(content, extraScripts));
});

// Edit Article: Handle Submission
app.post('/edit/:id', (req, res) => {
  const articleId = parseInt(req.params.id, 10);
  const article = articles.find(a => a.id === articleId);

  if (!article) {
    return res.status(404).send(renderLayout('<h2>Article not found</h2>'));
  }

  const { title, content } = req.body;
  article.title = title;
  article.content = content;

  res.redirect('/');
});

// Delete Article
app.post('/delete/:id', (req, res) => {
  const articleId = parseInt(req.params.id, 10);
  articles = articles.filter(a => a.id !== articleId);
  res.redirect('/');
});

// Start the server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
