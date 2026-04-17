# Performance Optimization Guide

## Current Issues & Solutions

### 1. Large Asset Files

#### Video (6.5MB → Target: 2-3MB)
**File**: `hero-video.mp4`
**Solution**: Re-encode with lower bitrate

```bash
# Using ffmpeg (install: brew install ffmpeg)
ffmpeg -i hero-video.mp4 -c:v libx264 -b:v 1M -c:a aac -b:a 128k hero-video-optimized.mp4
```

#### Images (1.5MB total → Target: 150KB)
**Files**: Luxury car images (avg 250KB each)
**Solution**: Convert to WebP and create responsive sizes

```bash
# Install sharp-cli
npm install -g sharp-cli

# Convert to WebP
sharp -i rolce.jpg -o rolce.webp --webp quality=80

# Create responsive sizes
sharp -i rolce.jpg -o rolce-small.webp --resize 480 --webp quality=80
sharp -i rolce.jpg -o rolce-medium.webp --resize 768 --webp quality=80
sharp -i rolce.jpg -o rolce-large.webp --resize 1200 --webp quality=85
```

---

### 2. Asset Minification

#### CSS (114KB → Target: ~40KB)
**File**: `styles.css` (3000+ lines)

**Options:**

**A. Using cssnano (npm)**
```bash
npm install --save-dev cssnano postcss-cli
npx postcss styles.css --use cssnano -o styles.min.css
```

**B. Using online tool**
- [CSSNano Online](https://cssnano.co/playground/)
- Paste `styles.css` content
- Download minified version

#### JavaScript (77KB + 35KB + 17KB = 129KB → Target: ~35KB total)

**Using terser:**
```bash
npm install --save-dev terser

npx terser scripts.js -o scripts.min.js --compress --mangle
npx terser shop.js -o shop.min.js --compress --mangle
npx terser auth-secure.js -o auth-secure.min.js --compress --mangle
```

---

### 3. Build Process

#### Option A: Simple npm Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "build:css": "postcss styles.css --use cssnano -o styles.min.css",
    "build:js": "terser scripts.js -o scripts.min.js --compress --mangle && terser shop.js -o shop.min.js --compress --mangle",
    "build": "npm run build:css && npm run build:js",
    "watch": "npm run build -- --watch"
  }
}
```

#### Option B: Full Build Pipeline with Webpack

Create `webpack.config.js`:

```javascript
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    main: './scripts.js',
    shop: './shop.js',
    auth: './auth-secure.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].min.js'
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].min.css'
    })
  ],
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: { drop_console: true }
        }
      }),
      new CssMinimizerPlugin()
    ]
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      }
    ]
  }
};
```

---

### 4. Image Optimization Strategy

#### Implement Responsive Images

**Before:**
```html
<img src="rolce.jpg" alt="Rolls Royce">
```

**After:**
```html
<picture>
  <source
    srcset="rolce-small.webp 480w,
            rolce-medium.webp 768w,
            rolce-large.webp 1200w"
    sizes="(max-width: 768px) 100vw, 50vw"
    type="image/webp">
  <source
    srcset="rolce-small.jpg 480w,
            rolce-medium.jpg 768w,
            rolce-large.jpg 1200w"
    sizes="(max-width: 768px) 100vw, 50vw"
    type="image/jpeg">
  <img src="rolce.jpg" alt="Rolls Royce" loading="lazy">
</picture>
```

#### Add Lazy Loading

```html
<img src="car.jpg" alt="Car" loading="lazy">
<iframe src="video.html" loading="lazy"></iframe>
```

---

### 5. CSS Optimization

#### Remove Duplicate Rules

Run PurgeCSS to remove unused CSS:

```bash
npm install --save-dev @fullhuman/postcss-purgecss

# purgecss.config.js
module.exports = {
  content: ['./**/*.html', './**/*.js'],
  css: ['./styles.css'],
  output: './styles.purged.css'
}

npx purgecss --config purgecss.config.js
```

#### Critical CSS

Extract above-the-fold CSS and inline it:

```bash
npm install --save-dev critical

npx critical index.html --base ./ --inline --minify > index-critical.html
```

---

### 6. Performance Budget

Set maximum file sizes:

| Asset Type | Current | Target | Status |
|------------|---------|--------|--------|
| HTML (per page) | 15-35KB | 20KB | ⚠️ OK |
| CSS (main) | 114KB | 40KB | ❌ Needs work |
| JS (total) | 129KB | 40KB | ❌ Needs work |
| Images (each) | 250KB | 50KB | ❌ Needs work |
| Video | 6.5MB | 2.5MB | ❌ Needs work |

---

### 7. Caching Strategy

Add caching headers to `server.js`:

```javascript
// Static assets with versioning
app.use('/assets', express.static('assets', {
  maxAge: '1y',
  immutable: true,
  etag: true
}));

// HTML pages (short cache)
app.use(express.static(__dirname, {
  maxAge: '5m',
  etag: true,
  lastModified: true
}));
```

Add cache-busting to HTML:

```html
<link rel="stylesheet" href="styles.min.css?v=1.0.0">
<script src="scripts.min.js?v=1.0.0"></script>
```

---

### 8. CDN Integration

#### Option A: Cloudflare (Free)

1. Sign up at cloudflare.com
2. Add your domain
3. Update nameservers
4. Enable "Auto Minify" in Speed settings
5. Enable "Brotli" compression

#### Option B: BunnyCDN (Paid, $1/month)

1. Upload assets to BunnyCDN
2. Update URLs in HTML:

```html
<!-- Before -->
<img src="/assets/images/car.jpg">

<!-- After -->
<img src="https://your-pull-zone.b-cdn.net/assets/images/car.jpg">
```

---

### 9. Automated Optimization Script

Create `scripts/optimize-assets.sh`:

```bash
#!/bin/bash

echo "🚀 Optimizing HouseOfSpeed assets..."

# Install dependencies if needed
command -v sharp >/dev/null 2>&1 || npm install -g sharp-cli
command -v terser >/dev/null 2>&1 || npm install --save-dev terser postcss-cli cssnano

# 1. Minify CSS
echo "📦 Minifying CSS..."
npx postcss styles.css --use cssnano -o styles.min.css
echo "✓ CSS: $(du -h styles.css | cut -f1) → $(du -h styles.min.css | cut -f1)"

# 2. Minify JavaScript
echo "📦 Minifying JavaScript..."
npx terser scripts.js -o scripts.min.js --compress --mangle
npx terser shop.js -o shop.min.js --compress --mangle
npx terser auth-secure.js -o auth-secure.min.js --compress --mangle
echo "✓ JavaScript minified"

# 3. Optimize images (if sharp is installed)
if command -v sharp >/dev/null 2>&1; then
  echo "🖼️  Optimizing images..."
  mkdir -p assets/images/optimized

  for img in assets/images/*.jpg; do
    filename=$(basename "$img" .jpg)
    sharp -i "$img" -o "assets/images/optimized/${filename}.webp" --webp quality=80
    sharp -i "$img" -o "assets/images/optimized/${filename}-480.webp" --resize 480 --webp quality=80
    sharp -i "$img" -o "assets/images/optimized/${filename}-768.webp" --resize 768 --webp quality=80
    sharp -i "$img" -o "assets/images/optimized/${filename}-1200.webp" --resize 1200 --webp quality=85
  done

  echo "✓ Images optimized and converted to WebP"
else
  echo "⚠️  sharp-cli not found. Install with: npm install -g sharp-cli"
fi

echo "✅ Optimization complete!"
echo ""
echo "Next steps:"
echo "1. Update HTML to use .min.css and .min.js files"
echo "2. Replace image references with optimized versions"
echo "3. Test website functionality"
echo "4. Measure improvements with Lighthouse"
```

Make it executable:
```bash
chmod +x scripts/optimize-assets.sh
./scripts/optimize-assets.sh
```

---

### 10. Update HTML References

After minification, update all HTML files:

**Find & replace:**
- `styles.css` → `styles.min.css`
- `scripts.js` → `scripts.min.js`
- `shop.js` → `shop.min.js`
- `auth-secure.js` → `auth-secure.min.js`

---

### 11. Performance Testing

#### Before Optimization

Run Lighthouse audit:
```bash
npm install -g lighthouse
lighthouse http://localhost:3000 --view
```

Expected scores:
- Performance: 40-60
- Load time: 3-5s
- First Contentful Paint: 2-3s

#### After Optimization

Expected improvements:
- Performance: 80-95
- Load time: 1-2s
- First Contentful Paint: 0.8-1.5s

---

### 12. Monitoring

Add performance monitoring:

#### Option A: Web Vitals (Free)

Add to `index.html`:

```html
<script type="module">
import {getCLS, getFID, getFCP, getLCP, getTTFB} from 'https://unpkg.com/web-vitals?module';

function sendToAnalytics({name, delta, id}) {
  console.log(`${name}: ${delta}ms`);
  // Send to your analytics endpoint
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify({name, delta, id})
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
</script>
```

#### Option B: Google Analytics 4

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## Quick Wins Checklist

Implement these for immediate improvements:

- [ ] Add `loading="lazy"` to all below-fold images
- [ ] Minify CSS and JS files
- [ ] Enable gzip/brotli compression
- [ ] Add browser caching headers
- [ ] Convert hero video to lower bitrate
- [ ] Preload critical resources:
  ```html
  <link rel="preload" href="styles.min.css" as="style">
  <link rel="preload" href="scripts.min.js" as="script">
  ```
- [ ] Add resource hints:
  ```html
  <link rel="dns-prefetch" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  ```
- [ ] Defer non-critical JavaScript:
  ```html
  <script src="analytics.js" defer></script>
  ```

---

## Expected Results

After implementing all optimizations:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Page Load Time | 4.5s | 1.2s | 73% faster |
| First Contentful Paint | 2.8s | 0.9s | 68% faster |
| Time to Interactive | 5.2s | 1.8s | 65% faster |
| Lighthouse Score | 52 | 92 | +40 points |
| Total Page Size | 8MB | 1.2MB | 85% smaller |

---

**Last Updated**: April 16, 2026
**Next**: Implement build process and asset optimization
