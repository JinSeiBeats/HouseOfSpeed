/**
 * HOUSE OF SPEED - SCRIPTS.JS
 * Progressive enhancement with premium animations
 * Respects prefers-reduced-motion throughout
 */

(function() {
    'use strict';

    // ================================================================
    // MOTION PREFERENCE CHECK
    // ================================================================
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let motionAllowed = !prefersReducedMotion.matches;

    // Listen for changes to motion preference
    prefersReducedMotion.addEventListener('change', function(e) {
        motionAllowed = !e.matches;
    });

    // ================================================================
    // 1. SMOOTH PAGE LOAD ORCHESTRATION
    // ================================================================
    if (motionAllowed) {
        window.addEventListener('load', function() {
            requestAnimationFrame(function() {
                initHeroTextReveal();
            });
        });
    } else {
        // If motion is not allowed, still init hero but without animation
        window.addEventListener('load', function() {
            var heroTitle = document.querySelector('.hero-title[data-text-reveal]');
            if (heroTitle) {
                heroTitle.classList.add('revealed');
            }
        });
    }

    // ================================================================
    // 2. HERO TEXT REVEAL (word-by-word)
    // ================================================================
    function initHeroTextReveal() {
        var heroTitle = document.querySelector('.hero-title[data-text-reveal]');
        if (!heroTitle) return;

        var text = heroTitle.textContent.trim();
        var words = text.split(/\s+/);
        heroTitle.textContent = '';
        heroTitle.style.animation = 'none'; // Remove the old fadeInUp

        words.forEach(function(word, i) {
            var wordSpan = document.createElement('span');
            wordSpan.className = 'word';

            var innerSpan = document.createElement('span');
            innerSpan.className = 'word-inner';
            innerSpan.textContent = word;

            if (motionAllowed) {
                innerSpan.style.transitionDelay = (i * 0.08) + 's';
            }

            wordSpan.appendChild(innerSpan);
            heroTitle.appendChild(wordSpan);

            // Add space between words (except last)
            if (i < words.length - 1) {
                heroTitle.appendChild(document.createTextNode(' '));
            }
        });

        // Trigger reveal
        requestAnimationFrame(function() {
            heroTitle.classList.add('revealed');
        });
    }

    // ================================================================
    // 3. SCROLL-TRIGGERED ANIMATIONS (IntersectionObserver)
    // ================================================================
    if (motionAllowed) {
        // --- Section title reveal with decorative line ---
        var titleObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-revealed');
                    titleObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3, rootMargin: '0px 0px -50px 0px' });

        document.querySelectorAll('[data-animate-title]').forEach(function(el) {
            titleObserver.observe(el);
        });

        // --- Section content reveal ---
        var sectionObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-revealed');
                    sectionObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        // Observe major sections for stagger effects
        document.querySelectorAll(
            '.about-section, .newsletter-section, .footer, .contact-section'
        ).forEach(function(el) {
            sectionObserver.observe(el);
        });

        // --- Content container reveal ---
        var contentObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-revealed');
                    contentObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        document.querySelectorAll('.content-container').forEach(function(el) {
            contentObserver.observe(el);
        });

        // --- Image reveal (wipe/clip animation) ---
        var imageRevealObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-revealed');
                    imageRevealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });

        document.querySelectorAll('[data-image-reveal]').forEach(function(el) {
            imageRevealObserver.observe(el);
        });

        // --- Card entrance with stagger ---
        var cardObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    var card = entry.target;
                    var parent = card.parentElement;
                    var siblings = Array.from(parent.children);
                    var index = siblings.indexOf(card);

                    // Stagger delay based on position
                    card.style.transitionDelay = (index * 0.12) + 's';

                    requestAnimationFrame(function() {
                        card.classList.add('is-revealed');
                    });

                    cardObserver.unobserve(card);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

        document.querySelectorAll(
            '.shop-teaser-card, .service-card, .event-card, .feature-card, ' +
            '.partner-card, .news-card, .car-card'
        ).forEach(function(el) {
            cardObserver.observe(el);
        });

        // --- Generic reveal-on-scroll elements ---
        var revealObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-revealed');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.reveal-on-scroll').forEach(function(el) {
            revealObserver.observe(el);
        });

        // --- Legacy fade-in-section support ---
        var fadeObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    fadeObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.fade-in-section').forEach(function(el) {
            fadeObserver.observe(el);
        });
    }

    // ================================================================
    // 4. PARALLAX SCROLLING (disabled on mobile for performance)
    // ================================================================
    var isMobileDevice = window.matchMedia('(max-width: 768px)').matches;

    if (motionAllowed && !isMobileDevice) {
        var parallaxElements = document.querySelectorAll('[data-parallax]');
        var heroSection = document.querySelector('.hero');
        var ticking = false;

        function updateParallax() {
            var scrollY = window.pageYOffset;
            var windowHeight = window.innerHeight;

            // Hero parallax - subtle vertical shift on the video/overlay
            if (heroSection) {
                var heroVideo = heroSection.querySelector('.hero-video');
                var heroOverlay = heroSection.querySelector('.hero-overlay');
                if (scrollY < windowHeight) {
                    var heroShift = scrollY * 0.3;
                    if (heroVideo) {
                        heroVideo.style.transform = 'translate(-50%, calc(-50% + ' + heroShift + 'px))';
                    }
                }
            }

            // Element parallax
            parallaxElements.forEach(function(el) {
                var speed = parseFloat(el.getAttribute('data-parallax')) || 0.1;
                var rect = el.getBoundingClientRect();

                // Only animate when in or near viewport
                if (rect.bottom > -100 && rect.top < windowHeight + 100) {
                    var centerOffset = (rect.top + rect.height / 2 - windowHeight / 2);
                    var shift = centerOffset * speed;
                    el.style.transform = 'scale(1.15) translateY(' + shift + 'px)';
                }
            });

            ticking = false;
        }

        window.addEventListener('scroll', function() {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        }, { passive: true });

        // Initial call
        updateParallax();
    }

    // ================================================================
    // 5. MAGNETIC BUTTON HOVER
    // ================================================================
    if (motionAllowed) {
        var magneticBtns = document.querySelectorAll('.magnetic-btn');

        magneticBtns.forEach(function(btn) {
            btn.addEventListener('mousemove', function(e) {
                var rect = btn.getBoundingClientRect();
                var x = e.clientX - rect.left - rect.width / 2;
                var y = e.clientY - rect.top - rect.height / 2;

                // Subtle magnetic pull (max ~8px displacement)
                var strength = 0.25;
                btn.style.transform = 'translate(' + (x * strength) + 'px, ' + (y * strength) + 'px)';
            });

            btn.addEventListener('mouseleave', function() {
                btn.style.transform = '';
            });
        });
    }

    // ================================================================
    // 6. SMOOTH COUNTER (count-up animation)
    // ================================================================
    if (motionAllowed) {
        var counterObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        document.querySelectorAll('[data-count-to]').forEach(function(el) {
            counterObserver.observe(el);
        });

        function animateCounter(el) {
            var target = parseInt(el.getAttribute('data-count-to'), 10);
            var duration = parseInt(el.getAttribute('data-count-duration'), 10) || 2000;
            var start = 0;
            var startTime = null;

            function step(timestamp) {
                if (!startTime) startTime = timestamp;
                var progress = Math.min((timestamp - startTime) / duration, 1);

                // Ease out cubic
                var eased = 1 - Math.pow(1 - progress, 3);
                var current = Math.floor(eased * target);

                el.textContent = current.toLocaleString();

                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    el.textContent = target.toLocaleString();
                }
            }

            requestAnimationFrame(step);
        }
    }

    // ================================================================
    // 7. FORM VALIDATION & SUBMISSION
    // ================================================================
    var contactForm = document.getElementById('contactForm');

    if (contactForm) {
        var validators = {
            name: {
                test: function(value) { return value.trim().length >= 2; },
                message: 'Please enter your full name (minimum 2 characters)'
            },
            email: {
                test: function(value) { return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(value); },
                message: 'Please enter a valid email address'
            },
            message: {
                test: function(value) { return value.trim().length >= 10; },
                message: 'Please enter a message (minimum 10 characters)'
            },
            consent: {
                test: function(checked) { return checked === true; },
                message: 'You must agree to be contacted'
            }
        };

        Object.keys(validators).forEach(function(fieldName) {
            var field = document.getElementById(fieldName);
            if (!field) return;

            field.addEventListener('blur', function() {
                validateField(field, validators[fieldName]);
            });

            field.addEventListener('focus', function() {
                clearFieldError(field);
            });
        });

        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            var isValid = true;
            var formData = {};

            Object.keys(validators).forEach(function(fieldName) {
                var field = document.getElementById(fieldName);
                if (!field) return;

                var value = field.type === 'checkbox' ? field.checked : field.value;
                formData[fieldName] = value;

                if (!validateField(field, validators[fieldName])) {
                    isValid = false;
                }
            });

            if (!isValid) {
                showFormStatus('error', 'Please correct the errors above');
                return;
            }

            try {
                var submitBtn = contactForm.querySelector('.submit-btn');
                submitBtn.disabled = true;
                submitBtn.textContent = 'SENDING...';

                var response = await fetch(contactForm.action, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    showFormStatus('success', 'Thank you! Your message has been sent successfully.');
                    contactForm.reset();
                } else {
                    throw new Error('Form submission failed');
                }

                submitBtn.disabled = false;
                submitBtn.textContent = 'SEND MESSAGE';
            } catch (error) {
                showFormStatus('error', 'Sorry, there was an error sending your message. Please try again or contact us directly.');
                var submitBtn2 = contactForm.querySelector('.submit-btn');
                submitBtn2.disabled = false;
                submitBtn2.textContent = 'SEND MESSAGE';
            }
        });

        function validateField(field, validator) {
            var value = field.type === 'checkbox' ? field.checked : field.value;
            var isValid = validator.test(value);
            var errorElement = document.getElementById(field.id + '-error') ||
                               document.getElementById(field.id + 'Error');

            if (!isValid) {
                field.classList.add('error');
                field.setAttribute('aria-invalid', 'true');
                if (errorElement) errorElement.textContent = validator.message;
                return false;
            } else {
                field.classList.remove('error');
                field.setAttribute('aria-invalid', 'false');
                if (errorElement) errorElement.textContent = '';
                return true;
            }
        }

        function clearFieldError(field) {
            field.classList.remove('error');
            field.removeAttribute('aria-invalid');
            var errorElement = document.getElementById(field.id + '-error') ||
                               document.getElementById(field.id + 'Error');
            if (errorElement) errorElement.textContent = '';
        }

        function showFormStatus(type, message) {
            var statusElement = document.querySelector('.form-status');
            if (!statusElement) return;

            statusElement.className = 'form-status ' + type;
            statusElement.textContent = message;
            statusElement.setAttribute('role', 'alert');

            setTimeout(function() {
                statusElement.className = 'form-status';
                statusElement.textContent = '';
            }, 5000);
        }
    }

    // ================================================================
    // 8. MOBILE MENU ENHANCEMENTS
    // ================================================================
    var menuToggle = document.getElementById('menu-toggle');
    var mainMenu = document.querySelector('.main-menu');

    if (menuToggle && mainMenu) {
        var menuLinks = mainMenu.querySelectorAll('a');
        menuLinks.forEach(function(link) {
            link.addEventListener('click', function() {
                menuToggle.checked = false;
            });
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && menuToggle.checked) {
                menuToggle.checked = false;
            }
        });

        menuToggle.addEventListener('change', function() {
            var isExpanded = this.checked;
            this.setAttribute('aria-expanded', isExpanded);
            mainMenu.setAttribute('aria-hidden', !isExpanded);

            // Prevent body scroll when menu is open
            if (isExpanded) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });

        // Close menu when clicking outside on mobile
        document.addEventListener('click', function(e) {
            if (menuToggle.checked && !mainMenu.contains(e.target) && !e.target.closest('.hamburger')) {
                menuToggle.checked = false;
                menuToggle.dispatchEvent(new Event('change'));
            }
        });
    }

    // ================================================================
    // 9. SMOOTH SCROLL FOR ANCHOR LINKS
    // ================================================================
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            var href = this.getAttribute('href');
            if (href === '#' || href.startsWith('#lightbox')) return;

            e.preventDefault();
            var target = document.querySelector(href);

            if (target) {
                var navHeight = document.querySelector('.navbar') ? document.querySelector('.navbar').offsetHeight : 80;
                var offsetTop = target.getBoundingClientRect().top + window.pageYOffset - (navHeight + 50);

                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });

                history.pushState(null, null, href);
            }
        });
    });

    // ================================================================
    // 10. LAZY LOAD IMAGES (Native + Fallback)
    // ================================================================
    if ('loading' in HTMLImageElement.prototype === false) {
        var images = document.querySelectorAll('img[loading="lazy"]');

        var imageObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    var img = entry.target;
                    img.src = img.dataset.src || img.src;
                    img.removeAttribute('loading');
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(function(img) { imageObserver.observe(img); });
    }

    // ================================================================
    // 11. PRINT FUNCTIONALITY
    // ================================================================
    document.querySelectorAll('[data-print]').forEach(function(btn) {
        btn.addEventListener('click', function() {
            window.print();
        });
    });

    // ================================================================
    // 12. ACTIVE NAV LINK HIGHLIGHTING
    // ================================================================
    var currentLocation = location.pathname;
    var menuItems = document.querySelectorAll('.main-menu a');

    menuItems.forEach(function(link) {
        var linkPath = new URL(link.href).pathname;

        if (linkPath === currentLocation ||
            (currentLocation === '/' && linkPath === '/index.html') ||
            (currentLocation === '/index.html' && linkPath === '/')) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
    });

    // ================================================================
    // 13. LIGHTBOX KEYBOARD NAVIGATION
    // ================================================================
    var lightboxes = document.querySelectorAll('.lightbox');

    lightboxes.forEach(function(lightbox) {
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && window.location.hash.startsWith('#lightbox')) {
                window.location.hash = '#_';
            }
        });

        lightbox.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                var focusableElements = this.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
                var firstElement = focusableElements[0];
                var lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey && document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                } else if (!e.shiftKey && document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        });
    });

    // ================================================================
    // 14. PERFORMANCE: PRELOAD LINKS ON HOVER
    // ================================================================
    var navLinks = document.querySelectorAll('a[href$=".html"]');

    navLinks.forEach(function(link) {
        link.addEventListener('mouseenter', function() {
            var href = this.href;
            if (!document.querySelector('link[rel="prefetch"][href="' + href + '"]')) {
                var prefetch = document.createElement('link');
                prefetch.rel = 'prefetch';
                prefetch.href = href;
                document.head.appendChild(prefetch);
            }
        }, { once: true, passive: true });
    });

    // ================================================================
    // 15. NAVBAR SCROLL BEHAVIOR
    // ================================================================
    (function() {
        var navbar = document.querySelector('.navbar');
        if (!navbar) return;

        var lastScroll = 0;
        var navbarHeight = navbar.offsetHeight;

        // Recalculate navbar height on resize/orientation change
        window.addEventListener('resize', function() {
            navbarHeight = navbar.offsetHeight;
        }, { passive: true });

        window.addEventListener('scroll', function() {
            var currentScroll = window.pageYOffset;

            // Add/remove scrolled class for subtle background change
            if (currentScroll > navbarHeight) {
                navbar.style.background = 'rgba(20, 20, 20, 0.98)';
            } else {
                navbar.style.background = 'rgba(20, 20, 20, 0.95)';
            }

            lastScroll = currentScroll;
        }, { passive: true });
    })();

    // ================================================================
    // 16. CONSOLE MESSAGE
    // ================================================================
    console.log('%cHouse Of Speed', 'font-size: 24px; font-weight: bold; color: #c9a05b; font-family: "Times New Roman", serif;');
    console.log('%cA Sanctuary for Motor Connoisseurs', 'color: #cccccc; font-style: italic;');
    console.log('%chouseofspeed.dk', 'color: #c9a05b;');

})();

// ================================================================
// 17. INTERNATIONALIZATION (i18n) - EN/NL Language Switcher
// ================================================================
(function() {
    'use strict';

    var translations = {
        en: {
            // Navigation
            nav_about: 'ABOUT HOUSE OF SPEED',
            nav_storage: 'STORAGE',
            nav_cars: 'CARS FOR SALE',
            nav_events: 'MEETINGS & EVENTS',
            nav_partners: 'PARTNERS',
            nav_news: 'NEWS',
            nav_shop: 'SHOP',
            nav_contact: 'CONTACT',

            // Hero
            hero_title: 'WELCOME TO HOUSE OF SPEED',

            // About Section
            about_title: 'A SANCTUARY FOR MOTOR CONNOISSEURS',
            about_intro1: 'At HOUSE OF SPEED, we treasure international clients and partnerships. Therefore, we encourage you to reach out to us by using our contact form, sending us an e-mail, or giving us a call.',
            about_intro2: 'In the meantime, you can read more about HOUSE OF SPEED right here.',
            about_quote: '"Since I was a child, cars have been a significant part of my life. I treasure the mechanic, the exclusivity, the design, and the overwhelming power of the engine. At my estate, Rohden Gods, we have had our family garage for many years and held many events for other enthusiasts. It was here the idea of HOUSE OF SPEED arose."',
            about_mission1: 'A garage is more than just a place to store your car. It is a place to share your passion. And that is why HOUSE OF SPEED was created to behold all elements that an assembly point for motor connoisseurs must hold.',
            about_mission2: 'We have endeavored to develop supreme frames for ideal storage, modern workshops, social gatherings, and a space for inspiration and room to focus on the vehicle as a passion. HOUSE OF SPEED is an exclusive network with space to immerse in those elements which make each car unique. Furthermore, we provide easy access to world-class professionals who help solve all your wishes and ambitions for your vehicle.',
            about_focus: 'Our activities focus on four main areas: Sales, Service, Storage, and Social.',

            // Sales Section
            sales_title: 'SALES',
            sales_text: 'At HOUSE OF SPEED, we collaborate with a range of carefully selected business partners who offers sales and leasing of classic- and luxury vehicles. Besides our external partners, we furthermore operate our own sales department, SALES GARAGE, as well as an official dealership of brands such as Rolls-Royce, Lotus, KALMAR Automotive, Dallara Stradale, and Morgan.',

            // Service Section
            service_title: 'SERVICE',
            service_text: 'Our world-class workshop facilities provide comprehensive service for classic and luxury vehicles. From routine maintenance to complete restorations, our expert technicians deliver exceptional craftsmanship and attention to detail.',

            // Storage Section
            storage_title: 'STORAGE',
            storage_text: 'Our exclusive storage facility offers the perfect environment for your prized vehicles. Climate-controlled spaces, 24/7 security monitoring, and discrete access ensure your collection is preserved in optimal conditions. Each space is designed to accommodate the unique needs of classic and luxury automobile enthusiasts.',

            // Social Section
            social_title: 'SOCIAL',
            social_text: 'HOUSE OF SPEED is more than a garage -- it\'s a community. Join fellow enthusiasts for exclusive events, car meets, and social gatherings. From intimate dinner parties surrounded by automotive excellence to larger networking events, we create moments that celebrate the passion we all share for exceptional automobiles.',

            // Contact Section
            contact_title: 'CONTACT US',
            contact_directions: 'Get directions',
            form_name: 'NAME <span class="required">*</span>',
            form_email: 'EMAIL <span class="required">*</span>',
            form_message: 'MESSAGE <span class="required">*</span>',
            form_consent: 'Yes, please contact me <a href="privacy.html">Read declaration of consent</a>',
            form_submit: 'SEND MESSAGE',

            // Shop Teaser Section
            shop_title: 'THE HOUSE OF SPEED STORE',
            shop_subtitle: 'Exclusive merchandise, premium car care products, and curated accessories for the discerning motorist.',
            shop_badge_merch: 'Merchandise',
            shop_merch_title: 'HOS COLLECTION',
            shop_merch_text: 'Caps, jackets, gloves, polo shirts and more -- carry the spirit of House Of Speed.',
            shop_merch_link: 'Shop Collection',
            shop_badge_care: 'Car Care',
            shop_care_title: 'PREMIUM DETAILING',
            shop_care_text: 'Professional-grade car care products curated by our expert technicians for your prized vehicles.',
            shop_care_link: 'Shop Car Care',
            shop_badge_acc: 'Accessories',
            shop_acc_title: 'CURATED GIFTS',
            shop_acc_text: 'Keyrings, mugs, tote bags and laptop sleeves -- refined gifts for the motor enthusiast in your life.',
            shop_acc_link: 'Shop Accessories',
            shop_cta: 'VISIT THE STORE',

            // Newsletter Section
            newsletter_title: 'STAY INFORMED',
            newsletter_text: 'Subscribe to our newsletter for exclusive updates on events, new arrivals, and automotive insights.',
            newsletter_placeholder: 'Enter your email address',
            newsletter_btn: 'SUBSCRIBE',

            // Footer
            footer_tagline: 'A sanctuary for motor connoisseurs since 2016',
            footer_quick_links: 'QUICK LINKS',
            footer_about: 'About Us',
            footer_storage: 'Storage',
            footer_cars: 'Cars for Sale',
            footer_events: 'Meetings & Events',
            footer_partners: 'Partners',
            footer_shop: 'Shop',
            footer_contact: 'Contact',
            footer_hours_title: 'BUSINESS HOURS',
            footer_mon_fri: 'Monday - Friday',
            footer_sat: 'Saturday',
            footer_sun: 'Sunday',
            footer_closed: 'Closed',
            footer_hours_note: 'Visits by appointment preferred',
            footer_follow: 'FOLLOW US',
            footer_privacy: 'Privacy Policy',
            footer_terms: 'Terms & Conditions',
            footer_copyright: '\u00A9 2025 House Of Speed B.V. All rights reserved.',

            // About Page
            about_hero_title: 'A SANCTUARY FOR MOTORCONNAISSEURS',
            about_focus_text: 'Our activities focus on the following four main areas:',
            about_card_sales: 'Sales',
            about_card_sales_text: 'Carefully curated classic and luxury vehicles from trusted partners and our own exclusive dealership.',
            about_card_learn_more: 'Learn More \u2192',
            about_card_storage: 'Storage',
            about_card_storage_text: 'Premium climate-controlled storage facilities for your most prized vehicles.',
            about_card_learn_more2: 'Learn More \u2192',
            about_card_service: 'Service',
            about_card_service_text: 'World-class workshop with expert technicians for maintenance and restoration.',
            about_card_learn_more3: 'Learn More \u2192',
            about_card_events: 'Events',
            about_card_events_text: 'Exclusive gatherings for motor enthusiasts to share their passion.',
            about_card_learn_more4: 'Learn More \u2192',

            // Cart Page
            cart_title: 'YOUR CART',
            cart_summary_title: 'ORDER SUMMARY',
            cart_subtotal: 'Subtotal',
            cart_shipping: 'Shipping',
            cart_total: 'Total',
            cart_checkout_btn: 'Proceed to Checkout',
            cart_shipping_note: 'Free shipping on orders over €50',
            cart_we_accept: 'We Accept',

            // Checkout Page
            checkout_title: 'CHECKOUT',
            checkout_order_confirmed: 'ORDER CONFIRMED',
            checkout_thank_you: 'Thank you! Your order has been received.',
            checkout_confirm_email: 'You will receive a confirmation email shortly with your order details and tracking information.',
            checkout_continue_shopping: 'Continue Shopping',
            checkout_contact_info: 'CONTACT INFORMATION',
            checkout_first_name: 'First Name <span class="required">*</span>',
            checkout_last_name: 'Last Name <span class="required">*</span>',
            checkout_email: 'Email Address <span class="required">*</span>',
            checkout_phone: 'Phone Number',
            checkout_shipping_address: 'SHIPPING ADDRESS',
            checkout_street: 'Street Address <span class="required">*</span>',
            checkout_address2: 'Apartment, Suite, etc.',
            checkout_city: 'City <span class="required">*</span>',
            checkout_postal: 'Postal Code <span class="required">*</span>',
            checkout_country: 'Country <span class="required">*</span>',
            checkout_select_country: 'Select country...',
            checkout_shipping_method: 'SHIPPING METHOD',
            checkout_standard_delivery: 'Standard Delivery',
            checkout_standard_days: '3-5 business days',
            checkout_express_delivery: 'Express Delivery',
            checkout_express_days: '1-2 business days',
            checkout_collect_store: 'Collect In Store',
            checkout_payment: 'PAYMENT',
            checkout_payment_text: 'Your payment is processed securely. We accept the following payment methods:',
            checkout_card_name: 'Name on Card <span class="required">*</span>',
            checkout_card_number: 'Card Number <span class="required">*</span>',
            checkout_card_expiry: 'Expiry Date <span class="required">*</span>',
            checkout_notes_label: 'Order Notes (Optional)',
            checkout_notes_placeholder: 'Special instructions for your order...',
            checkout_consent: 'I agree to the <a href="privacy.html" target="_blank">Privacy Policy</a> and <a href="terms.html" target="_blank">Terms & Conditions</a> <span class="required">*</span>',
            checkout_place_order: 'PLACE ORDER',
            checkout_ssl: 'SSL Encrypted Payment',
            checkout_return_policy: '30-Day Return Policy',

            // Contact Page
            contact_title: 'CONTACT US',
            contact_directions: 'Get directions',

            // Gallery Page
            gallery_hero_title: 'GALLERY',
            gallery_collection_title: 'OUR COLLECTION',
            gallery_view_details: 'View Details',

            // News Page
            news_hero_title: 'NEWS & UPDATES',
            news_latest_title: 'LATEST FROM HOUSE OF SPEED',
            news_article1_title: 'New Arrivals: Exclusive Collection',
            news_article1_text: 'We\'re excited to announce several rare additions to our showroom, including a pristine 1967 Porsche 911S and a fully restored Mercedes-Benz 300SL Gullwing.',
            news_article1_link: 'Inquire \u2192',
            news_article2_title: 'Spring Event Announcement',
            news_article2_text: 'Join us for our annual Spring Gathering on April 12th. An exclusive showcase of classic and modern supercars with guest speakers from the industry.',
            news_article2_link: 'Register \u2192',
            news_article3_title: 'Expansion of Storage Facilities',
            news_article3_text: 'Due to high demand, we\'re expanding our climate-controlled storage facilities. New spaces available for reservation now.',
            news_article3_link: 'Learn More \u2192',

            // Partners Page
            partners_hero_title: 'OUR PARTNERS',
            partners_section_title: 'OFFICIAL DEALERSHIP & PARTNERSHIPS',
            partners_intro: 'House Of Speed is proud to serve as an official dealership for some of the world\'s most prestigious automotive brands. Our partnerships ensure access to exclusive vehicles and world-class service.',
            partners_rr_text: 'Official dealer for Rolls-Royce Motor Cars, offering the pinnacle of luxury automotive excellence.',
            partners_lotus_text: 'Authorized Lotus dealer, bringing British engineering and performance to the Netherlands.',
            partners_morgan_text: 'Exclusive Morgan dealership, celebrating timeless British craftsmanship.',
            partners_kalmar_text: 'Official partner for KALMAR\'s reimagined Porsche masterpieces.',
            partners_dallara_text: 'Authorized dealer for Dallara\'s track-focused road-legal supercar.',
            partners_cta_text: 'Interested in learning more about our brand partnerships?',
            partners_cta_btn: 'Contact Us',

            // Privacy Page
            privacy_title: 'PRIVACY POLICY',
            privacy_consent_title: 'Declaration of Consent',
            privacy_consent_text: 'By submitting your contact information through our forms, you consent to House Of Speed B.V. contacting you regarding your inquiry.',
            privacy_collection_title: 'Data Collection',
            privacy_collection_text: 'We collect the following information when you contact us:',
            privacy_collect_name: 'Name',
            privacy_collect_email: 'Email address',
            privacy_collect_phone: 'Phone number (if provided)',
            privacy_collect_message: 'Message content',
            privacy_use_title: 'Use of Data',
            privacy_use_text: 'Your data is used exclusively to respond to your inquiries and provide you with information about our services. We do not share your information with third parties except as required by law.',
            privacy_retention_title: 'Data Retention',
            privacy_retention_text: 'We retain your contact information for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law.',
            privacy_rights_title: 'Your Rights',
            privacy_rights_text: 'Under GDPR, you have the right to:',
            privacy_right_access: 'Access your personal data',
            privacy_right_correct: 'Correct inaccurate data',
            privacy_right_delete: 'Request deletion of your data',
            privacy_right_object: 'Object to processing of your data',
            privacy_right_portability: 'Data portability',
            privacy_contact_title: 'Contact',
            privacy_contact_text: 'For questions about our privacy policy or to exercise your rights, contact us at:',
            privacy_last_updated: 'Last updated: January 2025',

            // Services Page
            services_sales_title: 'SALES',
            services_sales_text: 'At HOUSE OF SPEED, we collaborate with a range of carefully selected business partners who offers sales and leasing of classic- and luxury vehicles. Besides our external partners, we furthermore operate our own sales department, SALES GARAGE, as well as an official dealership of brands such as Rolls-Royce, Lotus, KALMAR Automotive, Dallara Stradale, and Morgan.',
            services_sales_cta: 'Inquire About Available Vehicles',
            services_service_title: 'SERVICE',
            services_service_text: 'Our world-class workshop facilities provide comprehensive service for classic and luxury vehicles. From routine maintenance to complete restorations, our expert technicians deliver exceptional craftsmanship and attention to detail.',
            services_service_item1: 'Regular maintenance and servicing',
            services_service_item2: 'Complete restoration projects',
            services_service_item3: 'Performance upgrades',
            services_service_item4: 'Paint and bodywork',
            services_service_item5: 'Interior refurbishment',
            services_service_item6: 'Pre-purchase inspections',
            services_service_cta: 'Schedule Service',
            services_events_title: 'MEETINGS & EVENTS',
            services_events_text: 'House Of Speed hosts exclusive events for motor enthusiasts throughout the year. From intimate gatherings to large-scale exhibitions, our facilities provide the perfect backdrop for celebrating automotive excellence.',
            services_event_private: 'Private Viewings',
            services_event_private_text: 'Exclusive access to our collection and available vehicles for serious collectors.',
            services_event_meets: 'Car Meets',
            services_event_meets_text: 'Monthly gatherings where enthusiasts share their passion and showcase their vehicles.',
            services_event_workshop: 'Workshop Events',
            services_event_workshop_text: 'Educational sessions with our expert technicians and industry professionals.',
            services_events_cta_text: 'Interested in attending our next event?',
            services_events_cta_btn: 'Get in Touch',

            // Shop Page
            shop_hero_title: 'THE HOUSE OF SPEED STORE',
            shop_hero_subtitle: 'Exclusive Merchandise \u00B7 Premium Car Care \u00B7 Curated Accessories',
            shop_filter_all: 'All Products',
            shop_filter_merch: 'Merchandise',
            shop_filter_care: 'Car Care',
            shop_filter_acc: 'Accessories',
            shop_search_placeholder: 'Search products...',
            shop_sort_featured: 'Sort: Featured',
            shop_sort_price_asc: 'Price: Low to High',
            shop_sort_price_desc: 'Price: High to Low',
            shop_sort_name: 'Name: A\u2013Z',
            shop_banner_shipping: 'FREE SHIPPING',
            shop_banner_shipping_text: 'On all orders over €50',
            shop_banner_returns: '30-DAY RETURNS',
            shop_banner_returns_text: 'Hassle-free returns and exchanges',
            shop_banner_secure: 'SECURE CHECKOUT',
            shop_banner_secure_text: 'Encrypted payment processing',

            // Storage Page
            storage_hero_title: 'PREMIUM VEHICLE STORAGE',
            storage_section_title: 'SECURE & CLIMATE-CONTROLLED FACILITIES',
            storage_intro: 'Our state-of-the-art storage facilities provide the perfect environment for preserving your prized vehicles. Each space is carefully monitored and maintained to ensure your investment remains in pristine condition.',
            storage_climate_title: 'Climate Control',
            storage_climate_text: 'Temperature and humidity controlled environment',
            storage_security_title: '24/7 Security',
            storage_security_text: 'Advanced surveillance and access control systems',
            storage_maintenance_title: 'Maintenance Service',
            storage_maintenance_text: 'Regular checks and battery conditioning available',
            storage_access_title: 'Flexible Access',
            storage_access_text: 'Visit your vehicle anytime with advance notice',
            storage_cta_text: 'Inquire about storage availability and pricing',
            storage_cta_btn: 'Contact Us',

            // Terms Page
            terms_title: 'TERMS & CONDITIONS',
            terms_last_updated: 'Last updated: January 1, 2025',
            terms_s1_title: '1. INTRODUCTION',
            terms_s2_title: '2. PRODUCTS & AVAILABILITY',
            terms_s3_title: '3. ORDERS & CONTRACT',
            terms_s4_title: '4. PAYMENT',
            terms_s5_title: '5. SHIPPING & DELIVERY',
            terms_s6_title: '6. RETURNS & RIGHT OF WITHDRAWAL',
            terms_s7_title: '7. WARRANTY & DEFECTIVE GOODS',
            terms_s8_title: '8. INTELLECTUAL PROPERTY',
            terms_s9_title: '9. LIMITATION OF LIABILITY',
            terms_s10_title: '10. COMPLAINTS & DISPUTE RESOLUTION',
            terms_s11_title: '11. GOVERNING LAW',
            terms_s12_title: '12. CHANGES TO TERMS',
            terms_s13_title: '13. CONTACT',
            terms_s13_text: 'For questions regarding these Terms and Conditions, please contact:',

            // 404 Page
            error_title: 'PAGE NOT FOUND',
            error_text: 'The page you\'re looking for doesn\'t exist or has been moved.',
            error_return_home: 'Return Home',
            error_or_visit: 'Or visit:',
            error_link_about: 'About',
            error_link_services: 'Services',
            error_link_contact: 'Contact'
        },
        nl: {
            // Navigation
            nav_about: 'OVER HOUSE OF SPEED',
            nav_storage: 'OPSLAG',
            nav_cars: 'AUTO\'S TE KOOP',
            nav_events: 'BIJEENKOMSTEN & EVENEMENTEN',
            nav_partners: 'PARTNERS',
            nav_news: 'NIEUWS',
            nav_shop: 'WINKEL',
            nav_contact: 'CONTACT',

            // Hero
            hero_title: 'WELKOM BIJ HOUSE OF SPEED',

            // About Section
            about_title: 'EEN TOEVLUCHTSOORD VOOR AUTOLIEFHEBBERS',
            about_intro1: 'Bij HOUSE OF SPEED koesteren wij internationale klanten en partnerschappen. Daarom moedigen wij u aan om contact met ons op te nemen via ons contactformulier, een e-mail te sturen of ons te bellen.',
            about_intro2: 'In de tussentijd kunt u hier meer lezen over HOUSE OF SPEED.',
            about_quote: '"Sinds mijn kindertijd zijn auto\'s een belangrijk onderdeel van mijn leven geweest. Ik koester de techniek, de exclusiviteit, het design en de overweldigende kracht van de motor. Op mijn landgoed, Rohden Gods, hebben we al jarenlang onze familiegarage gehad en vele evenementen georganiseerd voor andere enthousiastelingen. Hier ontstond het idee van HOUSE OF SPEED."',
            about_mission1: 'Een garage is meer dan alleen een plek om je auto te stallen. Het is een plek om je passie te delen. En daarom is HOUSE OF SPEED opgericht om alle elementen te bevatten die een ontmoetingspunt voor autoliefhebbers moet hebben.',
            about_mission2: 'Wij hebben ons ingespannen om uitstekende faciliteiten te ontwikkelen voor ideale opslag, moderne werkplaatsen, sociale bijeenkomsten en een ruimte voor inspiratie en aandacht voor het voertuig als passie. HOUSE OF SPEED is een exclusief netwerk met ruimte om je te verdiepen in de elementen die elke auto uniek maken. Bovendien bieden wij gemakkelijk toegang tot professionals van wereldklasse die helpen al uw wensen en ambities voor uw voertuig te vervullen.',
            about_focus: 'Onze activiteiten richten zich op vier hoofdgebieden: Verkoop, Service, Opslag en Sociaal.',

            // Sales Section
            sales_title: 'VERKOOP',
            sales_text: 'Bij HOUSE OF SPEED werken wij samen met een reeks zorgvuldig geselecteerde zakenpartners die verkoop en leasing van klassieke en luxe voertuigen aanbieden. Naast onze externe partners beheren wij bovendien onze eigen verkoopafdeling, SALES GARAGE, evenals een officieel dealerschap van merken zoals Rolls-Royce, Lotus, KALMAR Automotive, Dallara Stradale en Morgan.',

            // Service Section
            service_title: 'SERVICE',
            service_text: 'Onze werkplaatsfaciliteiten van wereldklasse bieden uitgebreide service voor klassieke en luxe voertuigen. Van routinematig onderhoud tot volledige restauraties, onze deskundige technici leveren uitzonderlijk vakmanschap en oog voor detail.',

            // Storage Section
            storage_title: 'OPSLAG',
            storage_text: 'Onze exclusieve opslagfaciliteit biedt de perfecte omgeving voor uw gekoesterde voertuigen. Klimaatgecontroleerde ruimtes, 24/7 beveiligingsbewaking en discrete toegang zorgen ervoor dat uw collectie in optimale omstandigheden bewaard blijft. Elke ruimte is ontworpen om aan de unieke behoeften van klassieke en luxe autoliefhebbers te voldoen.',

            // Social Section
            social_title: 'SOCIAAL',
            social_text: 'HOUSE OF SPEED is meer dan een garage -- het is een gemeenschap. Sluit u aan bij mede-enthousiastelingen voor exclusieve evenementen, autobijeenkomsten en sociale bijeenkomsten. Van intieme dinnerparty\'s omringd door automobiele excellentie tot grotere netwerkevenementen, wij creeren momenten die de passie vieren die wij allen delen voor uitzonderlijke auto\'s.',

            // Contact Section
            contact_title: 'NEEM CONTACT OP',
            contact_directions: 'Routebeschrijving',
            form_name: 'NAAM <span class="required">*</span>',
            form_email: 'E-MAIL <span class="required">*</span>',
            form_message: 'BERICHT <span class="required">*</span>',
            form_consent: 'Ja, neem contact met mij op <a href="privacy.html">Lees de toestemmingsverklaring</a>',
            form_submit: 'BERICHT VERSTUREN',

            // Shop Teaser Section
            shop_title: 'DE HOUSE OF SPEED WINKEL',
            shop_subtitle: 'Exclusieve merchandise, premium autoverzorgingsproducten en geselecteerde accessoires voor de veeleisende automobilist.',
            shop_badge_merch: 'Merchandise',
            shop_merch_title: 'HOS COLLECTIE',
            shop_merch_text: 'Petten, jassen, handschoenen, poloshirts en meer -- draag de geest van House Of Speed.',
            shop_merch_link: 'Bekijk Collectie',
            shop_badge_care: 'Autoverzorging',
            shop_care_title: 'PREMIUM DETAILING',
            shop_care_text: 'Professionele autoverzorgingsproducten samengesteld door onze deskundige technici voor uw gekoesterde voertuigen.',
            shop_care_link: 'Bekijk Autoverzorging',
            shop_badge_acc: 'Accessoires',
            shop_acc_title: 'GESELECTEERDE CADEAUS',
            shop_acc_text: 'Sleutelhangers, mokken, tassen en laptophoezen -- verfijnde cadeaus voor de autoliefhebber in uw leven.',
            shop_acc_link: 'Bekijk Accessoires',
            shop_cta: 'BEZOEK DE WINKEL',

            // Newsletter Section
            newsletter_title: 'BLIJF OP DE HOOGTE',
            newsletter_text: 'Schrijf u in voor onze nieuwsbrief voor exclusieve updates over evenementen, nieuwe aanwinsten en automobiele inzichten.',
            newsletter_placeholder: 'Voer uw e-mailadres in',
            newsletter_btn: 'INSCHRIJVEN',

            // Footer
            footer_tagline: 'Een toevluchtsoord voor autoliefhebbers sinds 2016',
            footer_quick_links: 'SNELLE LINKS',
            footer_about: 'Over Ons',
            footer_storage: 'Opslag',
            footer_cars: 'Auto\'s te Koop',
            footer_events: 'Bijeenkomsten & Evenementen',
            footer_partners: 'Partners',
            footer_shop: 'Winkel',
            footer_contact: 'Contact',
            footer_hours_title: 'OPENINGSTIJDEN',
            footer_mon_fri: 'Maandag - Vrijdag',
            footer_sat: 'Zaterdag',
            footer_sun: 'Zondag',
            footer_closed: 'Gesloten',
            footer_hours_note: 'Bezoek op afspraak heeft de voorkeur',
            footer_follow: 'VOLG ONS',
            footer_privacy: 'Privacybeleid',
            footer_terms: 'Algemene Voorwaarden',
            footer_copyright: '\u00A9 2025 House Of Speed B.V. Alle rechten voorbehouden.',

            // About Page
            about_hero_title: 'EEN TOEVLUCHTSOORD VOOR AUTOLIEFHEBBERS',
            about_focus_text: 'Onze activiteiten richten zich op de volgende vier hoofdgebieden:',
            about_card_sales: 'Verkoop',
            about_card_sales_text: 'Zorgvuldig geselecteerde klassieke en luxe voertuigen van vertrouwde partners en ons eigen exclusieve dealerschap.',
            about_card_learn_more: 'Meer informatie \u2192',
            about_card_storage: 'Opslag',
            about_card_storage_text: 'Premium klimaatgecontroleerde opslagfaciliteiten voor uw meest gekoesterde voertuigen.',
            about_card_learn_more2: 'Meer informatie \u2192',
            about_card_service: 'Service',
            about_card_service_text: 'Werkplaats van wereldklasse met deskundige technici voor onderhoud en restauratie.',
            about_card_learn_more3: 'Meer informatie \u2192',
            about_card_events: 'Evenementen',
            about_card_events_text: 'Exclusieve bijeenkomsten voor autoliefhebbers om hun passie te delen.',
            about_card_learn_more4: 'Meer informatie \u2192',

            // Cart Page
            cart_title: 'UW WINKELWAGEN',
            cart_summary_title: 'BESTELOVERZICHT',
            cart_subtotal: 'Subtotaal',
            cart_shipping: 'Verzending',
            cart_total: 'Totaal',
            cart_checkout_btn: 'Ga naar afrekenen',
            cart_shipping_note: 'Gratis verzending bij bestellingen boven €50',
            cart_we_accept: 'Wij accepteren',

            // Checkout Page
            checkout_title: 'AFREKENEN',
            checkout_order_confirmed: 'BESTELLING BEVESTIGD',
            checkout_thank_you: 'Bedankt! Uw bestelling is ontvangen.',
            checkout_confirm_email: 'U ontvangt binnenkort een bevestigingsmail met uw bestelgegevens en trackinginformatie.',
            checkout_continue_shopping: 'Verder winkelen',
            checkout_contact_info: 'CONTACTGEGEVENS',
            checkout_first_name: 'Voornaam <span class="required">*</span>',
            checkout_last_name: 'Achternaam <span class="required">*</span>',
            checkout_email: 'E-mailadres <span class="required">*</span>',
            checkout_phone: 'Telefoonnummer',
            checkout_shipping_address: 'VERZENDADRES',
            checkout_street: 'Straatnaam <span class="required">*</span>',
            checkout_address2: 'Appartement, Suite, etc.',
            checkout_city: 'Stad <span class="required">*</span>',
            checkout_postal: 'Postcode <span class="required">*</span>',
            checkout_country: 'Land <span class="required">*</span>',
            checkout_select_country: 'Selecteer land...',
            checkout_shipping_method: 'VERZENDMETHODE',
            checkout_standard_delivery: 'Standaard bezorging',
            checkout_standard_days: '3-5 werkdagen',
            checkout_express_delivery: 'Expresbezorging',
            checkout_express_days: '1-2 werkdagen',
            checkout_collect_store: 'Ophalen in winkel',
            checkout_payment: 'BETALING',
            checkout_payment_text: 'Uw betaling wordt veilig verwerkt. Wij accepteren de volgende betaalmethoden:',
            checkout_card_name: 'Naam op kaart <span class="required">*</span>',
            checkout_card_number: 'Kaartnummer <span class="required">*</span>',
            checkout_card_expiry: 'Vervaldatum <span class="required">*</span>',
            checkout_notes_label: 'Opmerkingen bij bestelling (optioneel)',
            checkout_notes_placeholder: 'Speciale instructies voor uw bestelling...',
            checkout_consent: 'Ik ga akkoord met het <a href="privacy.html" target="_blank">Privacybeleid</a> en de <a href="terms.html" target="_blank">Algemene Voorwaarden</a> <span class="required">*</span>',
            checkout_place_order: 'BESTELLING PLAATSEN',
            checkout_ssl: 'SSL-versleutelde betaling',
            checkout_return_policy: '30 dagen retourbeleid',

            // Contact Page
            contact_title: 'NEEM CONTACT OP',
            contact_directions: 'Routebeschrijving',

            // Gallery Page
            gallery_hero_title: 'GALERIJ',
            gallery_collection_title: 'ONZE COLLECTIE',
            gallery_view_details: 'Details bekijken',

            // News Page
            news_hero_title: 'NIEUWS & UPDATES',
            news_latest_title: 'HET LAATSTE VAN HOUSE OF SPEED',
            news_article1_title: 'Nieuwe aanwinsten: Exclusieve collectie',
            news_article1_text: 'Wij zijn verheugd om verschillende zeldzame toevoegingen aan onze showroom aan te kondigen, waaronder een onberispelijke 1967 Porsche 911S en een volledig gerestaureerde Mercedes-Benz 300SL Gullwing.',
            news_article1_link: 'Informeer \u2192',
            news_article2_title: 'Aankondiging lente-evenement',
            news_article2_text: 'Sluit u aan bij onze jaarlijkse Lentebijeenkomst op 12 april. Een exclusieve showcase van klassieke en moderne supercars met gastsprekers uit de branche.',
            news_article2_link: 'Registreer \u2192',
            news_article3_title: 'Uitbreiding opslagfaciliteiten',
            news_article3_text: 'Door de grote vraag breiden wij onze klimaatgecontroleerde opslagfaciliteiten uit. Nieuwe ruimtes nu beschikbaar voor reservering.',
            news_article3_link: 'Meer informatie \u2192',

            // Partners Page
            partners_hero_title: 'ONZE PARTNERS',
            partners_section_title: 'OFFICIEEL DEALERSCHAP & PARTNERSCHAPPEN',
            partners_intro: 'House Of Speed is er trots op als officieel dealerschap te dienen voor enkele van de meest prestigieuze automerken ter wereld. Onze partnerschappen garanderen toegang tot exclusieve voertuigen en service van wereldklasse.',
            partners_rr_text: 'Officieel dealer voor Rolls-Royce Motor Cars, het toppunt van luxe automobiele excellentie.',
            partners_lotus_text: 'Geautoriseerd Lotus-dealer, Britse engineering en prestaties naar Nederland brengend.',
            partners_morgan_text: 'Exclusief Morgan-dealerschap, een viering van tijdloos Brits vakmanschap.',
            partners_kalmar_text: 'Officieel partner voor KALMAR\'s opnieuw vormgegeven Porsche-meesterwerken.',
            partners_dallara_text: 'Geautoriseerd dealer voor Dallara\'s baangerichte straatlegale supercar.',
            partners_cta_text: 'Ge\u00EFnteresseerd in meer informatie over onze merkpartnerschappen?',
            partners_cta_btn: 'Neem contact op',

            // Privacy Page
            privacy_title: 'PRIVACYBELEID',
            privacy_consent_title: 'Toestemmingsverklaring',
            privacy_consent_text: 'Door uw contactgegevens via onze formulieren in te dienen, stemt u in met het contact opnemen door House Of Speed B.V. met betrekking tot uw aanvraag.',
            privacy_collection_title: 'Gegevensverzameling',
            privacy_collection_text: 'Wij verzamelen de volgende informatie wanneer u contact met ons opneemt:',
            privacy_collect_name: 'Naam',
            privacy_collect_email: 'E-mailadres',
            privacy_collect_phone: 'Telefoonnummer (indien opgegeven)',
            privacy_collect_message: 'Berichtinhoud',
            privacy_use_title: 'Gebruik van gegevens',
            privacy_use_text: 'Uw gegevens worden uitsluitend gebruikt om op uw vragen te reageren en u informatie over onze diensten te verstrekken. Wij delen uw informatie niet met derden, behalve zoals vereist door de wet.',
            privacy_retention_title: 'Bewaring van gegevens',
            privacy_retention_text: 'Wij bewaren uw contactgegevens zo lang als nodig is om de doeleinden te vervullen die in dit beleid worden beschreven, tenzij een langere bewaartermijn wettelijk vereist is.',
            privacy_rights_title: 'Uw rechten',
            privacy_rights_text: 'Op grond van de AVG heeft u het recht om:',
            privacy_right_access: 'Toegang tot uw persoonsgegevens',
            privacy_right_correct: 'Onjuiste gegevens te corrigeren',
            privacy_right_delete: 'Verwijdering van uw gegevens te verzoeken',
            privacy_right_object: 'Bezwaar te maken tegen verwerking van uw gegevens',
            privacy_right_portability: 'Gegevensoverdraagbaarheid',
            privacy_contact_title: 'Contact',
            privacy_contact_text: 'Voor vragen over ons privacybeleid of om uw rechten uit te oefenen, neem contact met ons op via:',
            privacy_last_updated: 'Laatst bijgewerkt: januari 2025',

            // Services Page
            services_sales_title: 'VERKOOP',
            services_sales_text: 'Bij HOUSE OF SPEED werken wij samen met een reeks zorgvuldig geselecteerde zakenpartners die verkoop en leasing van klassieke en luxe voertuigen aanbieden. Naast onze externe partners beheren wij bovendien onze eigen verkoopafdeling, SALES GARAGE, evenals een officieel dealerschap van merken zoals Rolls-Royce, Lotus, KALMAR Automotive, Dallara Stradale en Morgan.',
            services_sales_cta: 'Informeer naar beschikbare voertuigen',
            services_service_title: 'SERVICE',
            services_service_text: 'Onze werkplaatsfaciliteiten van wereldklasse bieden uitgebreide service voor klassieke en luxe voertuigen. Van routinematig onderhoud tot volledige restauraties, onze deskundige technici leveren uitzonderlijk vakmanschap en oog voor detail.',
            services_service_item1: 'Regulier onderhoud en service',
            services_service_item2: 'Volledige restauratieprojecten',
            services_service_item3: 'Prestatie-upgrades',
            services_service_item4: 'Spuit- en carrosseriewerk',
            services_service_item5: 'Interieurrestauratie',
            services_service_item6: 'Aankoopkeuringen',
            services_service_cta: 'Service plannen',
            services_events_title: 'BIJEENKOMSTEN & EVENEMENTEN',
            services_events_text: 'House Of Speed organiseert het hele jaar door exclusieve evenementen voor autoliefhebbers. Van intieme bijeenkomsten tot grootschalige tentoonstellingen, onze faciliteiten bieden het perfecte decor om automobiele excellentie te vieren.',
            services_event_private: 'Priv\u00E9bezichtigingen',
            services_event_private_text: 'Exclusieve toegang tot onze collectie en beschikbare voertuigen voor serieuze verzamelaars.',
            services_event_meets: 'Autotreffen',
            services_event_meets_text: 'Maandelijkse bijeenkomsten waar enthousiastelingen hun passie delen en hun voertuigen tonen.',
            services_event_workshop: 'Workshop evenementen',
            services_event_workshop_text: 'Educatieve sessies met onze deskundige technici en professionals uit de branche.',
            services_events_cta_text: 'Ge\u00EFnteresseerd in deelname aan ons volgende evenement?',
            services_events_cta_btn: 'Neem contact op',

            // Shop Page
            shop_hero_title: 'DE HOUSE OF SPEED WINKEL',
            shop_hero_subtitle: 'Exclusieve Merchandise \u00B7 Premium Autoverzorging \u00B7 Geselecteerde Accessoires',
            shop_filter_all: 'Alle producten',
            shop_filter_merch: 'Merchandise',
            shop_filter_care: 'Autoverzorging',
            shop_filter_acc: 'Accessoires',
            shop_search_placeholder: 'Producten zoeken...',
            shop_sort_featured: 'Sorteren: Aanbevolen',
            shop_sort_price_asc: 'Prijs: Laag naar hoog',
            shop_sort_price_desc: 'Prijs: Hoog naar laag',
            shop_sort_name: 'Naam: A\u2013Z',
            shop_banner_shipping: 'GRATIS VERZENDING',
            shop_banner_shipping_text: 'Bij alle bestellingen boven €50',
            shop_banner_returns: '30 DAGEN RETOUR',
            shop_banner_returns_text: 'Probleemloos retourneren en ruilen',
            shop_banner_secure: 'VEILIG AFREKENEN',
            shop_banner_secure_text: 'Versleutelde betalingsverwerking',

            // Storage Page
            storage_hero_title: 'PREMIUM VOERTUIGOPSLAG',
            storage_section_title: 'BEVEILIGDE & KLIMAATGECONTROLEERDE FACILITEITEN',
            storage_intro: 'Onze ultramoderne opslagfaciliteiten bieden de perfecte omgeving voor het behoud van uw gekoesterde voertuigen. Elke ruimte wordt zorgvuldig bewaakt en onderhouden om ervoor te zorgen dat uw investering in onberispelijke staat blijft.',
            storage_climate_title: 'Klimaatbeheersing',
            storage_climate_text: 'Temperatuur- en vochtigheidsgecontroleerde omgeving',
            storage_security_title: '24/7 Beveiliging',
            storage_security_text: 'Geavanceerde bewaking en toegangscontrolesystemen',
            storage_maintenance_title: 'Onderhoudsservice',
            storage_maintenance_text: 'Regelmatige controles en accuconditionering beschikbaar',
            storage_access_title: 'Flexibele toegang',
            storage_access_text: 'Bezoek uw voertuig op elk moment met voorafgaande kennisgeving',
            storage_cta_text: 'Informeer naar beschikbaarheid en prijzen van opslag',
            storage_cta_btn: 'Neem contact op',

            // Terms Page
            terms_title: 'ALGEMENE VOORWAARDEN',
            terms_last_updated: 'Laatst bijgewerkt: 1 januari 2025',
            terms_s1_title: '1. INLEIDING',
            terms_s2_title: '2. PRODUCTEN & BESCHIKBAARHEID',
            terms_s3_title: '3. BESTELLINGEN & OVEREENKOMST',
            terms_s4_title: '4. BETALING',
            terms_s5_title: '5. VERZENDING & LEVERING',
            terms_s6_title: '6. RETOURNEREN & HERROEPINGSRECHT',
            terms_s7_title: '7. GARANTIE & DEFECTE GOEDEREN',
            terms_s8_title: '8. INTELLECTUEEL EIGENDOM',
            terms_s9_title: '9. BEPERKING VAN AANSPRAKELIJKHEID',
            terms_s10_title: '10. KLACHTEN & GESCHILLENBESLECHTING',
            terms_s11_title: '11. TOEPASSELIJK RECHT',
            terms_s12_title: '12. WIJZIGINGEN IN VOORWAARDEN',
            terms_s13_title: '13. CONTACT',
            terms_s13_text: 'Voor vragen over deze Algemene Voorwaarden kunt u contact opnemen met:',

            // 404 Page
            error_title: 'PAGINA NIET GEVONDEN',
            error_text: 'De pagina die u zoekt bestaat niet of is verplaatst.',
            error_return_home: 'Terug naar home',
            error_or_visit: 'Of bezoek:',
            error_link_about: 'Over ons',
            error_link_services: 'Diensten',
            error_link_contact: 'Contact'
        }
    };

    // Track whether hero text reveal has already run
    var heroRevealDone = false;

    /**
     * Set the active language and update all translatable elements.
     * @param {string} lang - Language code ('en' or 'nl')
     */
    function setLanguage(lang) {
        if (!translations[lang]) return;

        var currentLang = lang;
        var langData = translations[lang];

        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(function(el) {
            var key = el.getAttribute('data-i18n');
            if (langData[key] !== undefined) {
                // Check if the translation contains HTML (like form labels with <span> or <a>)
                if (langData[key].indexOf('<') !== -1) {
                    el.innerHTML = langData[key];
                } else {
                    el.textContent = langData[key];
                }
            }
        });

        // Update placeholder attributes
        document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
            var key = el.getAttribute('data-i18n-placeholder');
            if (langData[key] !== undefined) {
                el.placeholder = langData[key];
            }
        });

        // Update the html lang attribute
        document.documentElement.lang = lang;

        // Update language switcher button states
        document.querySelectorAll('.lang-btn').forEach(function(btn) {
            if (btn.getAttribute('data-lang') === lang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Re-run hero text reveal if it was already processed (word-by-word spans)
        var heroTitle = document.querySelector('.hero-title[data-text-reveal]');
        if (heroTitle && heroRevealDone) {
            // The hero title has been split into word spans by initHeroTextReveal.
            // We need to update its text content and re-split it.
            var newText = langData['hero_title'] || heroTitle.textContent;
            var words = newText.split(/\s+/);

            // Clear existing content
            heroTitle.textContent = '';
            heroTitle.style.animation = 'none';
            heroTitle.classList.remove('revealed');

            words.forEach(function(word, i) {
                var wordSpan = document.createElement('span');
                wordSpan.className = 'word';

                var innerSpan = document.createElement('span');
                innerSpan.className = 'word-inner';
                innerSpan.textContent = word;

                wordSpan.appendChild(innerSpan);
                heroTitle.appendChild(wordSpan);

                if (i < words.length - 1) {
                    heroTitle.appendChild(document.createTextNode(' '));
                }
            });

            // Immediately reveal (no animation on language switch)
            requestAnimationFrame(function() {
                heroTitle.classList.add('revealed');
            });
        }

        // Save preference
        try {
            localStorage.setItem('hos-language', lang);
        } catch (e) {
            // localStorage not available
        }
    }

    // Detect when hero reveal has completed
    var heroTitleEl = document.querySelector('.hero-title[data-text-reveal]');
    if (heroTitleEl) {
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && heroTitleEl.classList.contains('revealed')) {
                    heroRevealDone = true;
                    observer.disconnect();
                }
            });
        });
        observer.observe(heroTitleEl, { attributes: true, attributeFilter: ['class'] });
    }

    // Wire up language switcher buttons
    document.querySelectorAll('.lang-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var lang = this.getAttribute('data-lang');
            setLanguage(lang);
        });
    });

    // Load saved language preference on page load
    var savedLang = null;
    try {
        savedLang = localStorage.getItem('hos-language');
    } catch (e) {
        // localStorage not available
    }

    if (savedLang && translations[savedLang]) {
        // Apply saved language (but wait for page to be ready)
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                setLanguage(savedLang);
            });
        } else {
            setLanguage(savedLang);
        }
    }
    // If no saved preference, default is English (already in the HTML)

    // Expose setLanguage globally so it can be called from other scripts if needed
    window.setLanguage = setLanguage;

})();

// ================================================================
// 18. FEATURED CARS CAROUSEL (runs outside IIFE for page scope)
// ================================================================
(function() {
    'use strict';

    var carouselContainer = document.querySelector('.carousel-container');

    if (carouselContainer) {
        var track = carouselContainer.querySelector('.carousel-track');
        var cards = track.querySelectorAll('.car-card');
        var prevBtn = carouselContainer.querySelector('.carousel-prev');
        var nextBtn = carouselContainer.querySelector('.carousel-next');
        var dotsContainer = document.querySelector('.carousel-dots');
        var dots = dotsContainer ? dotsContainer.querySelectorAll('.carousel-dot') : [];

        var currentIndex = 0;
        var cardsPerView = getCardsPerView();
        var isDragging = false;
        var startX = 0;
        var currentTranslate = 0;
        var prevTranslate = 0;
        var animationID = 0;

        function getCardsPerView() {
            if (window.innerWidth <= 768) return 1;
            if (window.innerWidth <= 1024) return 2;
            return 3;
        }

        function getMaxIndex() {
            return Math.max(0, cards.length - cardsPerView);
        }

        function updateCarousel(animate) {
            if (animate === undefined) animate = true;
            var cardWidth = cards[0].offsetWidth;
            var gap = parseInt(getComputedStyle(track).gap) || 32;
            var offset = currentIndex * (cardWidth + gap);

            if (!animate) {
                track.style.transition = 'none';
            } else {
                track.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            }

            track.style.transform = 'translateX(-' + offset + 'px)';
            currentTranslate = -offset;
            prevTranslate = currentTranslate;

            dots.forEach(function(dot, index) {
                dot.classList.toggle('active', index === currentIndex);
                dot.setAttribute('aria-selected', index === currentIndex);
            });

            if (prevBtn) prevBtn.disabled = currentIndex === 0;
            if (nextBtn) nextBtn.disabled = currentIndex >= getMaxIndex();
        }

        function goToSlide(index) {
            currentIndex = Math.max(0, Math.min(index, getMaxIndex()));
            updateCarousel();
        }

        function goPrev() {
            if (currentIndex > 0) {
                currentIndex--;
                updateCarousel();
            }
        }

        function goNext() {
            if (currentIndex < getMaxIndex()) {
                currentIndex++;
                updateCarousel();
            }
        }

        if (prevBtn) prevBtn.addEventListener('click', goPrev);
        if (nextBtn) nextBtn.addEventListener('click', goNext);

        dots.forEach(function(dot, index) {
            dot.addEventListener('click', function() { goToSlide(index); });
        });

        carouselContainer.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft') goPrev();
            else if (e.key === 'ArrowRight') goNext();
        });

        function touchStart(e) {
            isDragging = true;
            startX = getPositionX(e);
            track.style.transition = 'none';
            animationID = requestAnimationFrame(animationLoop);
        }

        function touchMove(e) {
            if (!isDragging) return;
            var currentPosition = getPositionX(e);
            currentTranslate = prevTranslate + currentPosition - startX;
        }

        function touchEnd() {
            isDragging = false;
            cancelAnimationFrame(animationID);

            var movedBy = currentTranslate - prevTranslate;
            var threshold = cards[0].offsetWidth / 4;

            if (movedBy < -threshold) {
                goNext();
            } else if (movedBy > threshold) {
                goPrev();
            } else {
                updateCarousel();
            }
        }

        function getPositionX(e) {
            return e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        }

        function animationLoop() {
            if (isDragging) {
                track.style.transform = 'translateX(' + currentTranslate + 'px)';
                animationID = requestAnimationFrame(animationLoop);
            }
        }

        track.addEventListener('touchstart', touchStart, { passive: true });
        track.addEventListener('touchmove', touchMove, { passive: true });
        track.addEventListener('touchend', touchEnd);

        track.addEventListener('mousedown', touchStart);
        track.addEventListener('mousemove', touchMove);
        track.addEventListener('mouseup', touchEnd);
        track.addEventListener('mouseleave', function() {
            if (isDragging) touchEnd();
        });

        track.addEventListener('contextmenu', function(e) {
            if (isDragging) e.preventDefault();
        });

        cards.forEach(function(card) {
            card.addEventListener('dragstart', function(e) { e.preventDefault(); });
        });

        var resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function() {
                cardsPerView = getCardsPerView();
                if (currentIndex > getMaxIndex()) {
                    currentIndex = getMaxIndex();
                }
                updateCarousel(false);
            }, 150);
        });

        updateCarousel(false);
    }
})();
