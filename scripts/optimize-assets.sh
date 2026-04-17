#!/bin/bash

echo "🚀 Optimizing HouseOfSpeed assets..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this script from the project root."
    exit 1
fi

# Install dev dependencies if needed
echo "📦 Checking dependencies..."
npm install --save-dev > /dev/null 2>&1

# 1. Minify CSS
if [ -f "styles.css" ]; then
    echo "📦 Minifying CSS..."
    ORIGINAL_SIZE=$(du -h styles.css | cut -f1)
    npx postcss styles.css --use cssnano -o styles.min.css
    MINIFIED_SIZE=$(du -h styles.min.css | cut -f1)
    echo -e "${GREEN}✓${NC} CSS: $ORIGINAL_SIZE → $MINIFIED_SIZE"
else
    echo -e "${YELLOW}⚠${NC}  styles.css not found"
fi

# 2. Minify JavaScript files
echo ""
echo "📦 Minifying JavaScript..."

if [ -f "scripts.js" ]; then
    ORIGINAL_SIZE=$(du -h scripts.js | cut -f1)
    npx terser scripts.js -o scripts.min.js --compress --mangle
    MINIFIED_SIZE=$(du -h scripts.min.js | cut -f1)
    echo -e "${GREEN}✓${NC} scripts.js: $ORIGINAL_SIZE → $MINIFIED_SIZE"
fi

if [ -f "shop.js" ]; then
    ORIGINAL_SIZE=$(du -h shop.js | cut -f1)
    npx terser shop.js -o shop.min.js --compress --mangle
    MINIFIED_SIZE=$(du -h shop.min.js | cut -f1)
    echo -e "${GREEN}✓${NC} shop.js: $ORIGINAL_SIZE → $MINIFIED_SIZE"
fi

if [ -f "auth-secure.js" ]; then
    ORIGINAL_SIZE=$(du -h auth-secure.js | cut -f1)
    npx terser auth-secure.js -o auth-secure.min.js --compress --mangle
    MINIFIED_SIZE=$(du -h auth-secure.min.js | cut -f1)
    echo -e "${GREEN}✓${NC} auth-secure.js: $ORIGINAL_SIZE → $MINIFIED_SIZE"
fi

# 3. Check for sharp-cli
echo ""
if command -v sharp >/dev/null 2>&1; then
    echo "🖼️  Optimizing images..."
    mkdir -p assets/images/optimized

    # Count images
    IMG_COUNT=$(find assets/images -maxdepth 1 -name "*.jpg" -o -name "*.png" 2>/dev/null | wc -l)

    if [ "$IMG_COUNT" -gt 0 ]; then
        for img in assets/images/*.{jpg,png} 2>/dev/null; do
            if [ -f "$img" ]; then
                filename=$(basename "$img")
                name="${filename%.*}"
                ext="${filename##*.}"

                # Convert to WebP
                sharp -i "$img" -o "assets/images/optimized/${name}.webp" --webp quality=80 2>/dev/null

                # Create responsive sizes
                sharp -i "$img" -o "assets/images/optimized/${name}-480.webp" --resize 480 --webp quality=80 2>/dev/null
                sharp -i "$img" -o "assets/images/optimized/${name}-768.webp" --resize 768 --webp quality=80 2>/dev/null
                sharp -i "$img" -o "assets/images/optimized/${name}-1200.webp" --resize 1200 --webp quality=85 2>/dev/null

                echo -e "${GREEN}✓${NC} Optimized: $filename"
            fi
        done
        echo -e "${GREEN}✓${NC} Images optimized and converted to WebP"
    else
        echo -e "${YELLOW}⚠${NC}  No images found in assets/images/"
    fi
else
    echo -e "${YELLOW}⚠${NC}  sharp-cli not found. To optimize images:"
    echo "   npm install -g sharp-cli"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Optimization complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next steps:"
echo "   1. Update HTML to use .min.css and .min.js files"
echo "   2. Test website functionality"
echo "   3. Run: npm run test:perf"
echo ""
echo "💡 Tip: Add .min.* files to git for production deploys"
echo ""
