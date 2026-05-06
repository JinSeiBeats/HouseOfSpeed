# House Of Speed Website

A high-performance, accessible website for House Of Speed - a sanctuary for motor connoisseurs in Vejle, Denmark.

## 🚀 Features

- **Multi-page architecture** with semantic HTML5
- **Performance optimized** with critical CSS inlining, lazy loading, and minimal JavaScript
- **Fully responsive** with breakpoints at 320px, 480px, 768px, 1024px, 1440px
- **Accessibility first** with WCAG AA compliance, ARIA labels, and keyboard navigation
- **SEO optimized** with comprehensive meta tags, Open Graph, and sitemap
- **Pure CSS hamburger menu** - no JavaScript frameworks required
- **Form validation** with HTML5 + JavaScript enhancement
- **PWA ready** with manifest.json
- **Print optimized** with dedicated print stylesheet

## 📁 Project Structure

```
/HouseOfSpeed
├── index.html              # Homepage
├── about.html              # About page
├── services.html           # Services (Sales, Service, Events)
├── storage.html            # Vehicle storage information
├── gallery.html            # Image gallery with lightbox
├── contact.html            # Contact form
├── news.html               # News and updates
├── partners.html           # Brand partnerships
├── privacy.html            # Privacy policy (GDPR)
├── 404.html                # Error page
├── styles.css              # Main stylesheet (organized with comments)
├── print.css               # Print-specific styles
├── scripts.js              # JavaScript enhancements (~8KB)
├── robots.txt              # Search engine instructions
├── sitemap.xml             # Site structure for SEO
├── manifest.json           # PWA manifest
└── assets/
    ├── images/             # Optimized images (WebP + fallbacks)
    │   ├── gallery/        # Gallery images
    │   ├── *-480w.webp     # Small screens
    │   ├── *-768w.webp     # Tablets
    │   └── *-1200w.webp    # Desktop
    └── icons/              # Favicons and app icons
        ├── favicon-32x32.png
        ├── favicon-16x16.png
        ├── apple-touch-icon.png
        ├── icon-192x192.png
        └── icon-512x512.png
```

## 🎨 Design System

### Color Palette
- **Navy:** `#1a1f2e` - Primary dark background
- **Bronze:** `#b4916f` - Accent color (inspired by Rolls-Royce)
- **Cream:** `#f5f3f0` - Light background
- **Slate:** `#2c3e50` - Headings
- **Dark Navy:** `#0f131d` - Footer

### Typography
- **Primary Font:** Gill Sans (Rolls-Royce inspired)
- **Fallback:** System fonts for performance
- **Font Weights:** 200 (light), 300 (normal), 400 (medium), 700 (bold)

### Spacing Scale (8px base)
- `--spacing-xs`: 8px
- `--spacing-sm`: 16px
- `--spacing-md`: 32px
- `--spacing-lg`: 64px
- `--spacing-xl`: 96px

## 🛠️ Setup & Installation

### 1. Configure Contact Form

The contact form uses Formspree for handling submissions. To set up:

1. Sign up at [formspree.io](https://formspree.io)
2. Create a new form
3. Replace `YOUR_FORM_ID` in `contact.html`:
   ```html
   <form action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
   ```

### 2. Generate Favicons

Create favicons from your logo using these tools:

```bash
# Using ImageMagick (if installed)
convert logo.png -resize 32x32 assets/icons/favicon-32x32.png
convert logo.png -resize 16x16 assets/icons/favicon-16x16.png
convert logo.png -resize 180x180 assets/icons/apple-touch-icon.png
convert logo.png -resize 192x192 assets/icons/icon-192x192.png
convert logo.png -resize 512x512 assets/icons/icon-512x512.png
```

Or use online tools:
- [Favicon.io](https://favicon.io/)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

### 3. Optimize Images

#### Install Image Optimization Tools

```bash
# macOS (using Homebrew)
brew install imagemagick webp

# Ubuntu/Debian
sudo apt-get install imagemagick webp

# Windows
# Download from official sites:
# ImageMagick: https://imagemagick.org/script/download.php
# WebP: https://developers.google.com/speed/webp/download
```

#### Convert Images to WebP

```bash
# Single image
cwebp -q 85 input.jpg -o output.webp

# Batch conversion (all JPG files)
for file in *.jpg; do
    cwebp -q 85 "$file" -o "${file%.jpg}.webp"
done

# Generate responsive sizes
convert input.jpg -resize 480x assets/images/image-480w.jpg
convert input.jpg -resize 768x assets/images/image-768w.jpg
convert input.jpg -resize 1200x assets/images/image-1200w.jpg

# Then convert to WebP
cwebp -q 85 assets/images/image-480w.jpg -o assets/images/image-480w.webp
cwebp -q 85 assets/images/image-768w.jpg -o assets/images/image-768w.webp
cwebp -q 85 assets/images/image-1200w.jpg -o assets/images/image-1200w.webp
```

### 4. Minify Assets for Production

```bash
# CSS Minification (using clean-css-cli)
npm install -g clean-css-cli
cleancss -o styles.min.css styles.css

# JavaScript Minification (using terser)
npm install -g terser
terser scripts.js -o scripts.min.js --compress --mangle

# Or use online tools:
# CSS: https://cssminifier.com/
# JS: https://javascript-minifier.com/
```

## 🚢 Deployment

### Option 1: Netlify (Recommended)

1. **Connect Repository**
   - Push code to GitHub/GitLab
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Select your repository

2. **Configure Build Settings**
   - Build command: (leave empty - static site)
   - Publish directory: `/`

3. **Configure Redirects** (optional)
   Create `_redirects` file:
   ```
   # Redirect www to non-www
   https://www.houseofspeed.nl/* https://houseofspeed.nl/:splat 301!

   # 404 handling
   /* /404.html 404
   ```

4. **Configure Headers**
   Create `_headers` file:
   ```
   /*
     X-Frame-Options: DENY
     X-Content-Type-Options: nosniff
     X-XSS-Protection: 1; mode=block
     Referrer-Policy: strict-origin-when-cross-origin

   # Cache static assets
   /assets/*
     Cache-Control: public, max-age=31536000, immutable

   # Cache CSS/JS
   /*.css
     Cache-Control: public, max-age=31536000, immutable
   /*.js
     Cache-Control: public, max-age=31536000, immutable
   ```

5. **Configure Form Handling**
   - Netlify Forms is already configured in the HTML
   - No additional setup needed!

### Option 2: Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Option 3: Traditional Hosting (cPanel/Apache)

1. **Upload Files** via FTP/SFTP to public_html

2. **Configure .htaccess**
   ```apache
   # Enable compression
   <IfModule mod_deflate.c>
       AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
   </IfModule>

   # Cache static assets
   <IfModule mod_expires.c>
       ExpiresActive On
       ExpiresByType image/jpg "access plus 1 year"
       ExpiresByType image/jpeg "access plus 1 year"
       ExpiresByType image/gif "access plus 1 year"
       ExpiresByType image/png "access plus 1 year"
       ExpiresByType image/webp "access plus 1 year"
       ExpiresByType text/css "access plus 1 year"
       ExpiresByType application/javascript "access plus 1 year"
       ExpiresByType image/x-icon "access plus 1 year"
   </IfModule>

   # Security headers
   <IfModule mod_headers.c>
       Header set X-Content-Type-Options "nosniff"
       Header set X-Frame-Options "DENY"
       Header set X-XSS-Protection "1; mode=block"
   </IfModule>

   # Force HTTPS
   RewriteEngine On
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

   # Remove www
   RewriteCond %{HTTP_HOST} ^www\.(.*)$ [NC]
   RewriteRule ^(.*)$ https://%1/$1 [R=301,L]

   # Custom 404
   ErrorDocument 404 /404.html
   ```

## ⚡ Performance Optimization Checklist

### Before Going Live

- [ ] **Images**
  - [ ] Convert all images to WebP with JPEG/PNG fallback
  - [ ] Generate responsive sizes (480w, 768w, 1200w)
  - [ ] Add proper `alt` attributes
  - [ ] Implement `loading="lazy"` for below-the-fold images

- [ ] **CSS**
  - [ ] Critical CSS is inlined in `<head>`
  - [ ] Minified CSS for production
  - [ ] Remove unused CSS rules

- [ ] **JavaScript**
  - [ ] Minified JS for production
  - [ ] `defer` attribute on scripts
  - [ ] No render-blocking JS

- [ ] **Fonts**
  - [ ] System fonts used (no external font loading)
  - [ ] `font-display: swap` if custom fonts added

- [ ] **Meta Tags**
  - [ ] All pages have unique titles
  - [ ] Meta descriptions under 155 characters
  - [ ] Open Graph images present
  - [ ] Canonical URLs set

- [ ] **Forms**
  - [ ] Formspree ID configured
  - [ ] Honeypot field present
  - [ ] Validation working
  - [ ] GDPR consent checkbox

- [ ] **SEO**
  - [ ] `robots.txt` uploaded
  - [ ] `sitemap.xml` uploaded
  - [ ] Google Search Console verified
  - [ ] Schema markup considered

- [ ] **Accessibility**
  - [ ] All images have alt text
  - [ ] Forms have labels
  - [ ] Color contrast ≥4.5:1
  - [ ] Keyboard navigation works
  - [ ] Screen reader tested

- [ ] **Security**
  - [ ] HTTPS enabled
  - [ ] Security headers configured
  - [ ] No sensitive data in code
  - [ ] External links have `rel="noopener noreferrer"`

## 🧪 Testing

### Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Performance Testing

```bash
# Lighthouse CLI
npm install -g lighthouse
lighthouse https://houseofspeed.nl --view

# Target Scores:
# Performance: >90
# Accessibility: 100
# Best Practices: 100
# SEO: 100
```

### Accessibility Testing

- [ ] [WAVE](https://wave.webaim.org/)
- [ ] [axe DevTools](https://www.deque.com/axe/devtools/)
- [ ] Screen reader (NVDA/JAWS/VoiceOver)
- [ ] Keyboard-only navigation

## 📊 Performance Targets

- **Initial Payload:** <400KB
- **First Contentful Paint:** <1.5s
- **Largest Contentful Paint:** <2.5s
- **Cumulative Layout Shift:** <0.1
- **Time to Interactive:** <3.5s
- **Lighthouse Score:** >90

## 🔧 Maintenance

### Update Sitemap
After adding/removing pages, update `sitemap.xml` with:
```xml
<lastmod>2025-01-15</lastmod>
```

### Update Copyright Year
Update footer copyright in all HTML files annually.

### Monitor Performance
- Run Lighthouse monthly
- Check Google Search Console weekly
- Monitor form submissions via Formspree dashboard

## 📝 Content Management

### Adding New Pages

1. Copy `about.html` as template
2. Update `<title>`, meta tags, and content
3. Add to `sitemap.xml`
4. Add link to navigation in all HTML files
5. Test all links

### Updating Contact Information

Update in multiple locations:
- Header navigation (`tel:` link)
- Contact page (all contact details)
- Footer (address)
- `sitemap.xml` (canonical URLs)

## 🐛 Troubleshooting

### Form Not Submitting
1. Check Formspree ID is correct
2. Verify internet connection
3. Check browser console for errors
4. Test with minimal data first

### Images Not Loading
1. Verify file paths are correct
2. Check image file names match HTML
3. Ensure WebP support or fallback working
4. Check browser console for 404 errors

### Mobile Menu Not Working
1. Verify checkbox `#menu-toggle` exists
2. Check CSS media queries
3. Test in different browsers
4. Clear browser cache

## 📚 Resources

- [MDN Web Docs](https://developer.mozilla.org/)
- [Web.dev](https://web.dev/)
- [A11y Project](https://www.a11yproject.com/)
- [Can I Use](https://caniuse.com/)
- [WebAIM](https://webaim.org/)

## 📄 License

© 2025 House Of Speed A/S. All rights reserved.

## 👨‍💻 Development

Built with vanilla HTML, CSS, and JavaScript - no frameworks, maximum performance.

**Key Technologies:**
- Semantic HTML5
- CSS Custom Properties
- CSS Grid & Flexbox
- IntersectionObserver API
- FormData API
- Progressive Enhancement

---

For questions or support, contact: info@houseofspeed.nl