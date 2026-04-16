/* ================================================================
   HOUSE OF SPEED - SHOP.JS
   Cart management, product data, and shop UI logic
   ================================================================ */

'use strict';

/* ================================================================
   PRODUCT DATA
   ================================================================ */
const HOS_PRODUCTS = [
    {
        id: 1,
        name: 'HOS Classic Cap',
        category: 'merchandise',
        price: 249,
        currency: 'EUR',
        image: 'assets/images/ferrari1.jpg',
        badge: 'Bestseller',
        description: 'Premium embroidered cap featuring the House Of Speed logo. Crafted from high-quality cotton twill with an adjustable strap for a perfect fit. Available in our signature forest green with gold embroidery.',
        sizes: ['One Size'],
        colors: ['Forest Green', 'Black', 'Cream'],
        sku: 'HOS-CAP-001',
        stock: 15,
        features: [
            '100% cotton twill construction',
            'Embroidered HOS logo',
            'Adjustable back strap',
            'Structured 6-panel design',
            'UV protection'
        ]
    },
    {
        id: 2,
        name: 'HOS Racing Jacket',
        category: 'merchandise',
        price: 1499,
        currency: 'EUR',
        image: 'assets/images/ferrari2.jpg',
        badge: 'New',
        description: 'Exclusive House Of Speed racing-inspired jacket. Lightweight yet warm, featuring premium materials and subtle HOS branding. The perfect companion for early morning drives or track days.',
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: ['Forest Green', 'Midnight Black'],
        sku: 'HOS-JKT-001',
        stock: 8,
        features: [
            'Premium polyester-nylon blend',
            'Water-resistant coating',
            'Embroidered HOS logo on chest and back',
            'Two zippered side pockets',
            'Elastic cuffs and hem',
            'Full-zip design'
        ]
    },
    {
        id: 3,
        name: 'HOS Leather Driving Gloves',
        category: 'merchandise',
        price: 599,
        currency: 'EUR',
        image: 'assets/images/ferari3.jpg',
        badge: null,
        description: 'Handcrafted Italian leather driving gloves with the House Of Speed signature. These premium gloves combine classic elegance with modern driving comfort, featuring perforated leather panels for breathability.',
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Tan', 'Black'],
        sku: 'HOS-GLV-001',
        stock: 20,
        features: [
            'Genuine Italian leather',
            'Perforated ventilation panels',
            'Snap button closure',
            'Padded palm grip',
            'HOS logo embossed on cuff'
        ]
    },
    {
        id: 4,
        name: 'HOS Signature Polo',
        category: 'merchandise',
        price: 449,
        currency: 'EUR',
        image: 'assets/images/ferrari4.jpg',
        badge: null,
        description: 'Classic piqué polo shirt with the House Of Speed emblem. Timeless styling meets premium quality in this versatile piece that transitions seamlessly from the garage to the clubhouse.',
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: ['Forest Green', 'White', 'Navy'],
        sku: 'HOS-PLO-001',
        stock: 25,
        features: [
            '100% premium cotton piqué',
            'Three-button placket',
            'Embroidered HOS logo on chest',
            'Ribbed collar and cuffs',
            'Regular fit'
        ]
    },
    {
        id: 5,
        name: 'Premium Detailing Kit',
        category: 'car-care',
        price: 799,
        currency: 'EUR',
        image: 'assets/images/rolce.jpg',
        badge: 'Popular',
        description: 'A curated selection of professional-grade car care products assembled by our expert technicians at House Of Speed. Everything you need to maintain your luxury vehicle\'s showroom finish.',
        sizes: null,
        colors: null,
        sku: 'HOS-DET-001',
        stock: 12,
        features: [
            'Premium carnauba wax (200ml)',
            'Foam applicator pad (x2)',
            'Professional microfiber cloth (x4)',
            'Interior leather conditioner (150ml)',
            'Glass cleaner concentrate (250ml)',
            'Tire shine spray (300ml)'
        ]
    },
    {
        id: 6,
        name: 'Ceramic Coating Kit',
        category: 'car-care',
        price: 1899,
        currency: 'EUR',
        image: 'assets/images/rolce2.jpg',
        badge: 'Professional',
        description: 'Professional-grade ceramic coating kit for long-lasting paint protection. Provides a hydrophobic, high-gloss barrier against environmental contaminants. Used by our workshop team on the most prestigious vehicles.',
        sizes: null,
        colors: null,
        sku: 'HOS-CER-001',
        stock: 6,
        features: [
            '9H hardness ceramic formula',
            'Hydrophobic protection up to 3 years',
            'Gloss enhancer included (50ml)',
            'Applicator suede pads (x3)',
            'Prep spray (200ml)',
            'Infrared curing compatible'
        ]
    },
    {
        id: 7,
        name: 'Microfiber Detailing Set',
        category: 'car-care',
        price: 149,
        currency: 'EUR',
        image: 'assets/images/ferrari1.jpg',
        badge: null,
        description: 'Set of 8 premium microfiber cloths in varying weights and textures for different detailing tasks. Safe for use on all paint surfaces, glass, leather, and chrome.',
        sizes: null,
        colors: null,
        sku: 'HOS-MFC-001',
        stock: 50,
        features: [
            '8 cloths included',
            '400 GSM ultra-plush finish cloths (x4)',
            '280 GSM glass and chrome cloths (x4)',
            'Edgeless design - no scratching',
            'Machine washable up to 60°C'
        ]
    },
    {
        id: 8,
        name: 'Leather Interior Care Kit',
        category: 'car-care',
        price: 549,
        currency: 'EUR',
        image: 'assets/images/ferrari2.jpg',
        badge: null,
        description: 'Complete interior leather care system for maintaining the supple elegance of your luxury vehicle\'s cabin. Cleans, conditions, and protects all leather surfaces.',
        sizes: null,
        colors: null,
        sku: 'HOS-LTH-001',
        stock: 18,
        features: [
            'Leather cleaner spray (250ml)',
            'Deep conditioning cream (150ml)',
            'UV protection sealant (100ml)',
            'Soft bristle brush',
            '2 x application sponges',
            'Suitable for all leather grades'
        ]
    },
    {
        id: 9,
        name: 'HOS Brass Keyring',
        category: 'accessories',
        price: 299,
        currency: 'EUR',
        image: 'assets/images/ferari3.jpg',
        badge: null,
        description: 'Solid brass keyring with the House Of Speed emblem. A refined piece for the discerning motorist. Each keyring is individually numbered and comes presented in a premium gift box.',
        sizes: null,
        colors: ['Polished Brass', 'Brushed Gold'],
        sku: 'HOS-KEY-001',
        stock: 30,
        features: [
            'Solid brass construction',
            'Individually numbered',
            'HOS emblem engraved',
            'Heavy-duty swivel connector',
            'Presented in gift box'
        ]
    },
    {
        id: 10,
        name: 'HOS Canvas Tote Bag',
        category: 'accessories',
        price: 349,
        currency: 'EUR',
        image: 'assets/images/ferrari4.jpg',
        badge: null,
        description: 'Heavy-duty canvas tote bag with the House Of Speed logo. Perfect for the garage, market, or everyday use. Reinforced handles and a secure zip-top closure.',
        sizes: null,
        colors: ['Natural Canvas', 'Forest Green'],
        sku: 'HOS-TOT-001',
        stock: 22,
        features: [
            'Heavy-duty 12oz cotton canvas',
            'Reinforced double handles',
            'Zip top closure',
            'Interior zip pocket',
            'HOS logo screen printed',
            '40L capacity'
        ]
    },
    {
        id: 11,
        name: 'HOS Coffee Mug',
        category: 'accessories',
        price: 199,
        currency: 'EUR',
        image: 'assets/images/rolce.jpg',
        badge: null,
        description: 'Premium porcelain mug with the House Of Speed logo. Double-walled for temperature retention. Start every morning in style with this elegant addition to your collection.',
        sizes: null,
        colors: ['Forest Green', 'Black'],
        sku: 'HOS-MUG-001',
        stock: 35,
        features: [
            'Premium bone china porcelain',
            'Double-walled construction',
            '350ml capacity',
            'Dishwasher safe',
            'HOS logo in gold print'
        ]
    },
    {
        id: 12,
        name: 'HOS Laptop Sleeve',
        category: 'accessories',
        price: 499,
        currency: 'EUR',
        image: 'assets/images/rolce2.jpg',
        badge: 'New',
        description: 'Premium felt laptop sleeve with leather trim and House Of Speed branding. Protects your laptop in style, whether at the office or trackside. Compatible with 13\' and 15\' laptops.',
        sizes: ['13 inch', '15 inch'],
        colors: ['Charcoal Grey', 'Forest Green'],
        sku: 'HOS-SLV-001',
        stock: 14,
        features: [
            'Premium wool felt exterior',
            'Full-grain leather trim',
            'Soft suede interior lining',
            'YKK zipper closure',
            'HOS logo debossed in leather',
            'Magnetic closure pocket'
        ]
    }
];

/* ================================================================
   CART MANAGEMENT
   ================================================================ */
const Cart = {
    STORAGE_KEY: 'hos_cart',

    getItems() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
        } catch {
            return [];
        }
    },

    saveItems(items) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
        this.updateBadge();
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { items } }));
    },

    addItem(productId, quantity, size, color) {
        const product = HOS_PRODUCTS.find(p => p.id === productId);
        if (!product) return;

        const items = this.getItems();
        const key = `${productId}-${size || 'default'}-${color || 'default'}`;
        const existing = items.find(i => i.key === key);

        if (existing) {
            existing.quantity = Math.min(existing.quantity + quantity, 10);
        } else {
            items.push({
                key,
                productId,
                name: product.name,
                price: product.price,
                image: product.image,
                size: size || null,
                color: color || null,
                quantity: Math.min(quantity, 10)
            });
        }

        this.saveItems(items);
        this.showAddedNotification(product.name);
    },

    removeItem(key) {
        const items = this.getItems().filter(i => i.key !== key);
        this.saveItems(items);
    },

    updateQuantity(key, quantity) {
        const items = this.getItems();
        const item = items.find(i => i.key === key);
        if (!item) return;

        if (quantity <= 0) {
            this.removeItem(key);
        } else {
            item.quantity = Math.min(quantity, 10);
            this.saveItems(items);
        }
    },

    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.updateBadge();
    },

    getTotal() {
        return this.getItems().reduce((sum, item) => sum + item.price * item.quantity, 0);
    },

    getCount() {
        return this.getItems().reduce((sum, item) => sum + item.quantity, 0);
    },

    updateBadge() {
        const count = this.getCount();
        document.querySelectorAll('.cart-badge').forEach(badge => {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        });
    },

    showAddedNotification(name) {
        const existing = document.querySelector('.cart-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span><strong>${name}</strong> added to cart</span>
            <a href="cart.html">View Cart</a>
        `;
        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('visible'), 10);
        setTimeout(() => {
            notification.classList.remove('visible');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
};

/* ================================================================
   CART ICON INJECTION
   Injects cart icon into the navbar on every page
   ================================================================ */
function injectCartIcon() {
    const navRight = document.querySelector('.nav-right');
    if (!navRight) return;

    const cartLink = document.createElement('a');
    cartLink.href = 'cart.html';
    cartLink.className = 'cart-icon-link';
    cartLink.setAttribute('aria-label', 'Shopping cart');
    cartLink.innerHTML = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        <span class="cart-badge" style="display:none">0</span>
    `;

    // Insert before hamburger label
    const hamburger = navRight.querySelector('.hamburger');
    if (hamburger) {
        navRight.insertBefore(cartLink, hamburger);
    } else {
        navRight.appendChild(cartLink);
    }

    Cart.updateBadge();
}

/* ================================================================
   SHOP PAGE - PRODUCT GRID
   ================================================================ */
function initShopPage() {
    const grid = document.getElementById('product-grid');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('shop-search');
    const sortSelect = document.getElementById('shop-sort');

    if (!grid) return;

    let currentFilter = 'all';
    let currentSearch = '';
    let currentSort = 'default';

    function renderProducts() {
        let products = [...HOS_PRODUCTS];

        if (currentFilter !== 'all') {
            products = products.filter(p => p.category === currentFilter);
        }
        if (currentSearch) {
            const q = currentSearch.toLowerCase();
            products = products.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q)
            );
        }
        if (currentSort === 'price-asc') products.sort((a, b) => a.price - b.price);
        if (currentSort === 'price-desc') products.sort((a, b) => b.price - a.price);
        if (currentSort === 'name') products.sort((a, b) => a.name.localeCompare(b.name));

        if (products.length === 0) {
            grid.innerHTML = `<div class="shop-empty">
                <p>No products found. Try adjusting your filters.</p>
            </div>`;
            return;
        }

        grid.innerHTML = products.map(p => `
            <article class="product-card" data-id="${p.id}">
                <a href="product.html?id=${p.id}" class="product-card-image-link">
                    <div class="product-card-image" style="background-image: url('${p.image}')">
                        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
                        <div class="product-card-overlay">
                            <span class="product-quick-view">View Product</span>
                        </div>
                    </div>
                </a>
                <div class="product-card-body">
                    <p class="product-card-category">${categoryLabel(p.category)}</p>
                    <h3 class="product-card-name">
                        <a href="product.html?id=${p.id}">${p.name}</a>
                    </h3>
                    <p class="product-card-price">${p.price.toLocaleString('nl-NL')} EUR</p>
                    <button class="product-add-btn" onclick="Cart.addItem(${p.id}, 1, null, null)">
                        Add to Cart
                    </button>
                </div>
            </article>
        `).join('');
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderProducts();
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            currentSearch = this.value.trim();
            renderProducts();
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', function () {
            currentSort = this.value;
            renderProducts();
        });
    }

    renderProducts();
}

/* ================================================================
   PRODUCT DETAIL PAGE
   ================================================================ */
function initProductPage() {
    const container = document.getElementById('product-detail');
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'), 10);
    const product = HOS_PRODUCTS.find(p => p.id === id);

    if (!product) {
        container.innerHTML = '<p class="product-not-found">Product not found. <a href="shop.html">Return to shop</a></p>';
        return;
    }

    // Update page title
    document.title = `${product.name} | House Of Speed Shop`;

    // Render product detail
    container.innerHTML = `
        <div class="product-detail-grid">
            <div class="product-detail-image">
                <img src="${product.image}" alt="${product.name}" loading="eager">
                ${product.badge ? `<span class="product-badge product-badge-lg">${product.badge}</span>` : ''}
            </div>
            <div class="product-detail-info">
                <p class="product-breadcrumb">
                    <a href="shop.html">Shop</a> /
                    <a href="shop.html?category=${product.category}">${categoryLabel(product.category)}</a> /
                    ${product.name}
                </p>
                <h1 class="product-detail-name">${product.name}</h1>
                <p class="product-detail-sku">SKU: ${product.sku}</p>
                <p class="product-detail-price">${product.price.toLocaleString('nl-NL')} EUR</p>
                <p class="product-detail-desc">${product.description}</p>

                ${product.sizes ? `
                <div class="product-option-group">
                    <label class="product-option-label">SIZE</label>
                    <div class="product-option-buttons" id="size-options">
                        ${product.sizes.map((s, i) => `
                            <button class="option-btn ${i === 0 ? 'active' : ''}" data-value="${s}" onclick="selectOption('size', '${s}', this)">${s}</button>
                        `).join('')}
                    </div>
                </div>` : ''}

                ${product.colors ? `
                <div class="product-option-group">
                    <label class="product-option-label">COLOR</label>
                    <div class="product-option-buttons" id="color-options">
                        ${product.colors.map((c, i) => `
                            <button class="option-btn ${i === 0 ? 'active' : ''}" data-value="${c}" onclick="selectOption('color', '${c}', this)">${c}</button>
                        `).join('')}
                    </div>
                </div>` : ''}

                <div class="product-quantity-row">
                    <div class="quantity-control">
                        <button class="qty-btn" onclick="changeQty(-1)">−</button>
                        <input type="number" id="product-qty" value="1" min="1" max="10" readonly>
                        <button class="qty-btn" onclick="changeQty(1)">+</button>
                    </div>
                    <button class="cta-button product-add-to-cart" onclick="addProductToCart()">
                        ADD TO CART
                    </button>
                </div>

                <div class="product-features">
                    <h4 class="product-features-title">PRODUCT DETAILS</h4>
                    <ul>
                        ${product.features.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                </div>

                <div class="product-meta">
                    <div class="product-meta-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="1" y="3" width="15" height="13"></rect>
                            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                            <circle cx="5.5" cy="18.5" r="2.5"></circle>
                            <circle cx="18.5" cy="18.5" r="2.5"></circle>
                        </svg>
                        Free shipping on orders over €50
                    </div>
                    <div class="product-meta-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="23 4 23 10 17 10"></polyline>
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                        </svg>
                        30-day returns
                    </div>
                    <div class="product-meta-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                        Secure checkout
                    </div>
                </div>
            </div>
        </div>
    `;

    // Related products
    const related = HOS_PRODUCTS.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
    if (related.length > 0) {
        const relatedSection = document.getElementById('related-products');
        if (relatedSection) {
            relatedSection.innerHTML = `
                <h2 class="section-title-dark">YOU MAY ALSO LIKE</h2>
                <div class="product-grid">
                    ${related.map(p => `
                        <article class="product-card">
                            <a href="product.html?id=${p.id}" class="product-card-image-link">
                                <div class="product-card-image" style="background-image: url('${p.image}')">
                                    ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
                                </div>
                            </a>
                            <div class="product-card-body">
                                <h3 class="product-card-name"><a href="product.html?id=${p.id}">${p.name}</a></h3>
                                <p class="product-card-price">${p.price.toLocaleString('nl-NL')} EUR</p>
                                <button class="product-add-btn" onclick="Cart.addItem(${p.id}, 1, null, null)">Add to Cart</button>
                            </div>
                        </article>
                    `).join('')}
                </div>
            `;
        }
    }

    // Store selected options
    window._selectedSize = product.sizes ? product.sizes[0] : null;
    window._selectedColor = product.colors ? product.colors[0] : null;
}

window.selectOption = function (type, value, btn) {
    const container = btn.closest('.product-option-buttons');
    container.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (type === 'size') window._selectedSize = value;
    if (type === 'color') window._selectedColor = value;
};

window.changeQty = function (delta) {
    const input = document.getElementById('product-qty');
    if (!input) return;
    const newVal = Math.max(1, Math.min(10, parseInt(input.value) + delta));
    input.value = newVal;
};

window.addProductToCart = function () {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'), 10);
    const qty = parseInt(document.getElementById('product-qty').value) || 1;
    Cart.addItem(id, qty, window._selectedSize, window._selectedColor);
};

/* ================================================================
   CART PAGE
   ================================================================ */
function initCartPage() {
    const container = document.getElementById('cart-items');
    if (!container) return;

    function renderCart() {
        const items = Cart.getItems();
        const totalEl = document.getElementById('cart-total');
        const subtotalEl = document.getElementById('cart-subtotal');
        const shippingEl = document.getElementById('cart-shipping');
        const countEl = document.getElementById('cart-count');

        if (items.length === 0) {
            container.innerHTML = `
                <div class="cart-empty">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    <h2>Your cart is empty</h2>
                    <p>Explore our collection and find something exceptional.</p>
                    <a href="shop.html" class="cta-button">Continue Shopping</a>
                </div>
            `;
            document.querySelector('.cart-summary')?.classList.add('hidden');
            return;
        }

        document.querySelector('.cart-summary')?.classList.remove('hidden');

        const subtotal = Cart.getTotal();
        const shipping = subtotal >= 500 ? 0 : 59;
        const total = subtotal + shipping;

        container.innerHTML = `
            <table class="cart-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr class="cart-row" data-key="${item.key}">
                            <td class="cart-product-cell">
                                <img src="${item.image}" alt="${item.name}" class="cart-product-img">
                                <div class="cart-product-info">
                                    <strong>${item.name}</strong>
                                    ${item.size ? `<span>Size: ${item.size}</span>` : ''}
                                    ${item.color ? `<span>Color: ${item.color}</span>` : ''}
                                </div>
                            </td>
                            <td class="cart-price">${item.price.toLocaleString('nl-NL')} EUR</td>
                            <td class="cart-qty-cell">
                                <div class="quantity-control">
                                    <button class="qty-btn" onclick="Cart.updateQuantity('${item.key}', ${item.quantity - 1})">−</button>
                                    <input type="number" value="${item.quantity}" min="1" max="10" class="cart-qty-input" readonly>
                                    <button class="qty-btn" onclick="Cart.updateQuantity('${item.key}', ${item.quantity + 1})">+</button>
                                </div>
                            </td>
                            <td class="cart-line-total">${(item.price * item.quantity).toLocaleString('nl-NL')} EUR</td>
                            <td>
                                <button class="cart-remove-btn" onclick="Cart.removeItem('${item.key}')" aria-label="Remove item">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                                    </svg>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="cart-actions">
                <a href="shop.html" class="cart-continue-link">← Continue Shopping</a>
                <button class="cart-clear-btn" onclick="if(confirm('Clear all items from cart?')) { Cart.clear(); renderCart(); }">Clear Cart</button>
            </div>
        `;

        if (subtotalEl) subtotalEl.textContent = subtotal.toLocaleString('nl-NL') + ' EUR';
        if (shippingEl) shippingEl.textContent = shipping === 0 ? 'FREE' : shipping.toLocaleString('nl-NL') + ' EUR';
        if (totalEl) totalEl.textContent = total.toLocaleString('nl-NL') + ' EUR';
        if (countEl) countEl.textContent = Cart.getCount();
    }

    // Make renderCart accessible globally for inline handlers
    window.renderCart = renderCart;

    window.addEventListener('cartUpdated', renderCart);
    renderCart();
}

/* ================================================================
   CHECKOUT PAGE
   ================================================================ */
function initCheckoutPage() {
    const summaryEl = document.getElementById('checkout-summary');
    const form = document.getElementById('checkout-form');
    if (!summaryEl || !form) return;

    function renderSummary() {
        const items = Cart.getItems();
        const subtotal = Cart.getTotal();
        const shipping = subtotal >= 500 ? 0 : 59;
        const total = subtotal + shipping;

        summaryEl.innerHTML = `
            <h3 class="checkout-summary-title">ORDER SUMMARY</h3>
            <div class="checkout-items">
                ${items.map(item => `
                    <div class="checkout-item">
                        <img src="${item.image}" alt="${item.name}" class="checkout-item-img">
                        <div class="checkout-item-info">
                            <strong>${item.name}</strong>
                            ${item.size ? `<span>Size: ${item.size}</span>` : ''}
                            ${item.color ? `<span>Color: ${item.color}</span>` : ''}
                            <span>Qty: ${item.quantity}</span>
                        </div>
                        <span class="checkout-item-price">${(item.price * item.quantity).toLocaleString('nl-NL')} EUR</span>
                    </div>
                `).join('')}
            </div>
            <div class="checkout-totals">
                <div class="checkout-total-row">
                    <span>Subtotal</span>
                    <span>${subtotal.toLocaleString('nl-NL')} EUR</span>
                </div>
                <div class="checkout-total-row">
                    <span>Shipping</span>
                    <span>${shipping === 0 ? 'FREE' : shipping.toLocaleString('nl-NL') + ' EUR'}</span>
                </div>
                <div class="checkout-total-row checkout-grand-total">
                    <span>Total</span>
                    <span>${total.toLocaleString('nl-NL')} EUR</span>
                </div>
            </div>
        `;

        if (items.length === 0) {
            summaryEl.innerHTML = `<p class="cart-empty-msg">Your cart is empty. <a href="shop.html">Return to shop</a></p>`;
        }
    }

    renderSummary();

    // Form validation and submission
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        let valid = true;

        const required = form.querySelectorAll('[required]');
        required.forEach(field => {
            field.classList.remove('error');
            if (!field.value.trim()) {
                field.classList.add('error');
                valid = false;
            }
        });

        const emailField = form.querySelector('#checkout-email');
        if (emailField && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value)) {
            emailField.classList.add('error');
            valid = false;
        }

        if (!valid) {
            document.getElementById('checkout-error').textContent = 'Please fill in all required fields correctly.';
            // Scroll to first error field on mobile
            var firstError = form.querySelector('.error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstError.focus();
            }
            return;
        }

        document.getElementById('checkout-error').textContent = '';

        // Simulate order confirmation
        Cart.clear();
        const confirmSection = document.getElementById('order-confirmation');
        const formSection = document.getElementById('checkout-form-section');
        if (confirmSection) confirmSection.style.display = 'block';
        if (formSection) formSection.style.display = 'none';

        const nameField = form.querySelector('#checkout-first-name');
        const orderName = document.getElementById('confirm-name');
        if (orderName && nameField) orderName.textContent = nameField.value;
    });
}

/* ================================================================
   UTILITY FUNCTIONS
   ================================================================ */
function categoryLabel(cat) {
    const labels = {
        'merchandise': 'Merchandise',
        'car-care': 'Car Care',
        'accessories': 'Accessories'
    };
    return labels[cat] || cat;
}

/* ================================================================
   INIT
   ================================================================ */
document.addEventListener('DOMContentLoaded', function () {
    injectCartIcon();
    initShopPage();
    initProductPage();
    initCartPage();
    initCheckoutPage();
});
