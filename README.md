# KunoFitness

Premium fitness equipment e-commerce website.

## Tech Stack

- HTML5, Tailwind CSS v4, Vanilla JavaScript (ES Modules)
- Static product data via `data/products.json`
- Images hosted on Cloudinary
- WhatsApp ordering flow
- Deployed on Netlify

## Project Structure

```
kunofitness/
├── assets/images/     ← Logo and favicons
├── css/
│   └── style.css      ← Custom global styles (buttons, fields, animations)
├── data/
│   └── products.json  ← All 12 products
├── js/
│   ├── main.js        ← Shared utilities (toast, cart badge, nav, copyright)
│   ├── cart.js        ← Cart logic using localStorage
│   ├── products.js    ← Fetch and render product cards + detail page
│   ├── filter.js      ← Search and category filter
│   └── whatsapp.js    ← WhatsApp order message builder
├── src/
│   ├── input.css      ← Tailwind entry point with @theme config
│   └── output.css     ← Generated CSS (do not edit manually)
├── *.html             ← 9 pages
├── favicon.ico
└── package.json
```

## Development

> ⚠️ This site uses ES Modules and `fetch()`. You MUST use a local server.
> Opening HTML files directly in the browser (file://) will break JavaScript.

### Step 1 — Install dependencies
```bash
npm install
```

### Step 2 — Start local server + Tailwind watcher (two terminals)

**Terminal 1 — Tailwind watcher:**
```bash
npm run watch
```

**Terminal 2 — Local server:**
```bash
npm run serve
```

Then open `http://localhost:3000` in your browser.

### Build for production
```bash
npm run build:min
```

## Before Going Live

1. Replace the WhatsApp number in `js/whatsapp.js`:
   ```js
   const WHATSAPP_NUMBER = "234XXXXXXXXXX";
   ```

2. Replace Unsplash placeholder images in `data/products.json` with real Cloudinary URLs.

3. Update contact details (email, address) in `contact.html` and `index.html`.

4. Deploy to Netlify — drag and drop the folder, or connect your GitHub repo.
"# kunofitness" 
