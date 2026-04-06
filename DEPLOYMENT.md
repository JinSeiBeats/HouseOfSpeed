# Deployment Checklist

## Pre-Deployment

### 1. Content Review
- [ ] All placeholder text replaced with real content
- [ ] All images replaced with actual photos
- [ ] Company information verified (address, phone, email, CVR)
- [ ] Legal pages reviewed (privacy policy)
- [ ] All links tested and working
- [ ] Spelling and grammar checked

### 2. Form Configuration
- [ ] Formspree account created
- [ ] Form ID updated in `contact.html`
- [ ] Test form submission
- [ ] Configure email notifications in Formspree
- [ ] Add email recipients
- [ ] Set up autoresponder (optional)

### 3. Image Optimization
```bash
# Create assets directory structure
mkdir -p assets/images/gallery
mkdir -p assets/icons

# Add your images to assets/images/
# Then run optimization commands from README.md
```

### 4. Favicon Generation
- [ ] Create 32x32 favicon
- [ ] Create 16x16 favicon
- [ ] Create 180x180 Apple touch icon
- [ ] Create 192x192 PWA icon
- [ ] Create 512x512 PWA icon
- [ ] Test favicons on multiple devices

### 5. Performance Optimization
```bash
# Minify CSS
cleancss -o styles.min.css styles.css

# Minify JavaScript
terser scripts.js -o scripts.min.js --compress --mangle

# Update HTML to use minified versions (production only)
# <link rel="stylesheet" href="styles.min.css">
# <script src="scripts.min.js" defer></script>
```

### 6. SEO Configuration
- [ ] Update `sitemap.xml` with correct domain
- [ ] Verify `robots.txt` allows indexing
- [ ] Create Google Search Console account
- [ ] Submit sitemap to Google
- [ ] Create Bing Webmaster Tools account
- [ ] Submit sitemap to Bing
- [ ] Set up Google Analytics (optional)

### 7. Domain & SSL
- [ ] Domain purchased and configured
- [ ] DNS records pointing to hosting
- [ ] SSL certificate installed (auto on Netlify/Vercel)
- [ ] HTTPS redirect working
- [ ] www to non-www redirect working

## Deployment Steps

### Option A: Netlify (Recommended)

1. **Push to Git**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/houseofspeed.git
git push -u origin main
```

2. **Deploy on Netlify**
- Go to https://app.netlify.com
- Click "New site from Git"
- Connect your repository
- Leave build settings empty (static site)
- Click "Deploy site"

3. **Configure Custom Domain**
- Go to Site settings > Domain management
- Add custom domain: `houseofspeed.dk`
- Follow DNS configuration instructions
- Enable HTTPS (automatic)

4. **Configure Form Notifications**
- Go to Site settings > Forms
- Set up email notifications
- Add webhook integrations if needed

### Option B: Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Add custom domain
vercel domains add houseofspeed.dk

# Production deployment
vercel --prod
```

### Option C: Traditional Hosting (cPanel)

1. **Upload Files**
- Connect via FTP/SFTP
- Upload all files to `public_html/`
- Set file permissions (644 for files, 755 for directories)

2. **Configure .htaccess**
- Upload `.htaccess` from project root
- Test redirects and caching

3. **SSL Certificate**
- Install SSL via cPanel (Let's Encrypt)
- Force HTTPS in .htaccess

4. **Form Handler**
- Configure PHP mail() or use Formspree
- Test form submissions

## Post-Deployment

### 1. Testing
- [ ] Test all pages on desktop
- [ ] Test all pages on mobile (iOS & Android)
- [ ] Test all forms
- [ ] Test all links (internal & external)
- [ ] Test 404 page
- [ ] Test print stylesheet
- [ ] Test in different browsers:
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge

### 2. Performance Audit
```bash
# Run Lighthouse
lighthouse https://houseofspeed.dk --view

# Target scores:
# Performance: >90
# Accessibility: 100
# Best Practices: 100
# SEO: 100
```

### 3. Accessibility Audit
- [ ] Run WAVE tool: https://wave.webaim.org/
- [ ] Check color contrast ratios
- [ ] Test keyboard navigation
- [ ] Test with screen reader
- [ ] Verify ARIA labels

### 4. SEO Verification
- [ ] Google Search Console verification
- [ ] Submit sitemap
- [ ] Check robots.txt
- [ ] Verify canonical URLs
- [ ] Check mobile usability
- [ ] Review structured data (if added)

### 5. Analytics Setup (Optional)
```html
<!-- Add to <head> of all pages -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### 6. Security Headers Verification
Test headers at: https://securityheaders.com/

Expected results:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

### 7. Speed Testing
- [ ] GTmetrix: https://gtmetrix.com/
- [ ] PageSpeed Insights: https://pagespeed.web.dev/
- [ ] WebPageTest: https://www.webpagetest.org/

Target metrics:
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1
- Total page size < 400KB

## Monitoring & Maintenance

### Weekly
- [ ] Check form submissions
- [ ] Monitor Google Search Console for errors
- [ ] Check website uptime

### Monthly
- [ ] Run Lighthouse audit
- [ ] Update news section
- [ ] Check for broken links
- [ ] Review analytics data

### Quarterly
- [ ] Update sitemap if pages added/removed
- [ ] Review and update content
- [ ] Check for outdated information
- [ ] Security updates (if applicable)

### Annually
- [ ] Update copyright year in footer
- [ ] Review privacy policy
- [ ] Renew domain registration
- [ ] Review hosting plan

## Rollback Procedure

If issues occur after deployment:

### Netlify/Vercel
1. Go to Deploys section
2. Find previous working deployment
3. Click "Publish deploy" to rollback

### Traditional Hosting
1. Keep backup of previous version
2. Upload backup files via FTP
3. Clear CDN cache if applicable

## Emergency Contacts

- **Domain Registrar:** [Insert contact]
- **Hosting Provider:** [Insert contact]
- **Form Service (Formspree):** support@formspree.io
- **Developer:** [Insert contact]

## Common Issues & Solutions

### Issue: Form not submitting
**Solution:**
1. Check Formspree ID in `contact.html`
2. Verify Formspree account is active
3. Check browser console for errors
4. Test with minimal data

### Issue: Images not loading
**Solution:**
1. Check file paths in HTML
2. Verify image files uploaded
3. Check file permissions (644)
4. Test in incognito mode

### Issue: Mobile menu not working
**Solution:**
1. Clear browser cache
2. Check `scripts.js` is loaded
3. Verify CSS media queries
4. Test in different browsers

### Issue: SSL certificate error
**Solution:**
1. Force HTTPS redirect
2. Update all internal links to HTTPS
3. Check mixed content warnings
4. Renew SSL certificate if expired

### Issue: Slow page load
**Solution:**
1. Optimize images further
2. Enable compression
3. Check CDN configuration
4. Review third-party scripts

## Success Metrics

Track these KPIs after launch:

- **Performance:** Lighthouse score >90
- **Uptime:** >99.9%
- **Form Submissions:** Track monthly
- **Page Load Time:** <3 seconds
- **Mobile Usage:** Monitor percentage
- **Bounce Rate:** <50% target
- **Organic Traffic:** Monitor growth

## Next Steps After Launch

1. **Content Marketing**
   - Blog posts about luxury vehicles
   - Social media integration
   - Newsletter signup

2. **Enhanced Features**
   - Live chat integration
   - Vehicle inventory system
   - Customer portal

3. **Marketing**
   - Google Ads campaign
   - Social media advertising
   - Email marketing

---

**Remember:** Always test changes on a staging environment before deploying to production!