/* ================================================================
   HOUSE OF SPEED - AUTH.JS
   Supabase Authentication Client
   Connects to local MasterWeaver Supabase instance
   ================================================================ */

const HOS_AUTH = (function() {
    'use strict';

    // Supabase connection config
    const SUPABASE_URL = 'http://localhost:8000';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlLWRlbW8iLCJpYXQiOjE2NDE3NjkyMDAsImV4cCI6MTc5OTUzNTYwMH0.zQomPPgIVgwVRMh3NJhhAl2cJ-GKQgNXpMTbIKxKyoo';

    const AUTH_URL = SUPABASE_URL + '/auth/v1';
    const REST_URL = SUPABASE_URL + '/rest/v1';
    const SESSION_KEY = 'hos_session';

    // ============================================================
    // SESSION MANAGEMENT
    // ============================================================

    function getSession() {
        try {
            const raw = localStorage.getItem(SESSION_KEY);
            if (!raw) return null;
            const session = JSON.parse(raw);
            // Check if token is expired
            if (session.expires_at && Date.now() / 1000 > session.expires_at) {
                // Try refresh
                return session; // Return stale session, caller should refresh
            }
            return session;
        } catch (e) {
            return null;
        }
    }

    function saveSession(data) {
        const session = {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: data.expires_at || (Date.now() / 1000 + data.expires_in),
            user: data.user
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return session;
    }

    function clearSession() {
        localStorage.removeItem(SESSION_KEY);
    }

    function getAccessToken() {
        const session = getSession();
        return session ? session.access_token : null;
    }

    function getUser() {
        const session = getSession();
        return session ? session.user : null;
    }

    function isLoggedIn() {
        const session = getSession();
        if (!session || !session.access_token) return false;
        if (session.expires_at && Date.now() / 1000 > session.expires_at) return false;
        return true;
    }

    // ============================================================
    // API HELPERS
    // ============================================================

    function authHeaders(token) {
        return {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + (token || SUPABASE_ANON_KEY)
        };
    }

    function restHeaders(token) {
        return {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + (token || SUPABASE_ANON_KEY),
            'Accept-Profile': 'hos',
            'Content-Profile': 'hos'
        };
    }

    async function handleResponse(response) {
        const text = await response.text();
        let data;
        try { data = JSON.parse(text); } catch (e) { data = text; }
        if (!response.ok) {
            const msg = (data && (data.error_description || data.msg || data.message || data.error)) || 'Request failed';
            throw new Error(msg);
        }
        return data;
    }

    // ============================================================
    // AUTH METHODS
    // ============================================================

    async function signUp(email, password, firstName, lastName) {
        const response = await fetch(AUTH_URL + '/signup', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
                email: email,
                password: password,
                data: {
                    first_name: firstName || '',
                    last_name: lastName || ''
                }
            })
        });
        const data = await handleResponse(response);
        if (data.access_token) {
            saveSession(data);
            // Update profile with name
            if (firstName || lastName) {
                await updateProfile({ first_name: firstName, last_name: lastName });
            }
        }
        return data;
    }

    async function signIn(email, password) {
        const response = await fetch(AUTH_URL + '/token?grant_type=password', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ email: email, password: password })
        });
        const data = await handleResponse(response);
        if (data.access_token) {
            saveSession(data);
        }
        return data;
    }

    async function signOut() {
        const token = getAccessToken();
        if (token) {
            try {
                await fetch(AUTH_URL + '/logout', {
                    method: 'POST',
                    headers: authHeaders(token)
                });
            } catch (e) {
                // Ignore logout errors
            }
        }
        clearSession();
    }

    async function refreshSession() {
        const session = getSession();
        if (!session || !session.refresh_token) {
            clearSession();
            return null;
        }
        try {
            const response = await fetch(AUTH_URL + '/token?grant_type=refresh_token', {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ refresh_token: session.refresh_token })
            });
            const data = await handleResponse(response);
            if (data.access_token) {
                return saveSession(data);
            }
            return null;
        } catch (e) {
            clearSession();
            return null;
        }
    }

    async function resetPassword(email) {
        const response = await fetch(AUTH_URL + '/recover', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
                email: email,
                gotrue_meta_security: {}
            })
        });
        return handleResponse(response);
    }

    async function updatePassword(newPassword) {
        const token = getAccessToken();
        if (!token) throw new Error('Not authenticated');
        const response = await fetch(AUTH_URL + '/user', {
            method: 'PUT',
            headers: authHeaders(token),
            body: JSON.stringify({ password: newPassword })
        });
        return handleResponse(response);
    }

    // ============================================================
    // PROFILE METHODS
    // ============================================================

    async function getProfile() {
        const token = getAccessToken();
        if (!token) throw new Error('Not authenticated');
        const user = getUser();
        const response = await fetch(REST_URL + '/profiles?id=eq.' + user.id + '&select=*', {
            headers: restHeaders(token)
        });
        const data = await handleResponse(response);
        return data[0] || null;
    }

    async function updateProfile(updates) {
        const token = getAccessToken();
        if (!token) throw new Error('Not authenticated');
        const user = getUser();
        const response = await fetch(REST_URL + '/profiles?id=eq.' + user.id, {
            method: 'PATCH',
            headers: Object.assign({}, restHeaders(token), { 'Prefer': 'return=representation' }),
            body: JSON.stringify(updates)
        });
        const data = await handleResponse(response);
        return data[0] || null;
    }

    // ============================================================
    // ADDRESS METHODS
    // ============================================================

    async function getAddresses() {
        const token = getAccessToken();
        if (!token) throw new Error('Not authenticated');
        const response = await fetch(REST_URL + '/addresses?select=*&order=is_default.desc,created_at.desc', {
            headers: restHeaders(token)
        });
        return handleResponse(response);
    }

    async function addAddress(address) {
        const token = getAccessToken();
        if (!token) throw new Error('Not authenticated');
        const user = getUser();
        address.user_id = user.id;
        const response = await fetch(REST_URL + '/addresses', {
            method: 'POST',
            headers: Object.assign({}, restHeaders(token), { 'Prefer': 'return=representation' }),
            body: JSON.stringify(address)
        });
        return handleResponse(response);
    }

    async function updateAddress(id, updates) {
        const token = getAccessToken();
        if (!token) throw new Error('Not authenticated');
        const response = await fetch(REST_URL + '/addresses?id=eq.' + id, {
            method: 'PATCH',
            headers: Object.assign({}, restHeaders(token), { 'Prefer': 'return=representation' }),
            body: JSON.stringify(updates)
        });
        return handleResponse(response);
    }

    async function deleteAddress(id) {
        const token = getAccessToken();
        if (!token) throw new Error('Not authenticated');
        const response = await fetch(REST_URL + '/addresses?id=eq.' + id, {
            method: 'DELETE',
            headers: restHeaders(token)
        });
        if (!response.ok) throw new Error('Failed to delete address');
    }

    // ============================================================
    // ORDER METHODS
    // ============================================================

    async function getOrders() {
        const token = getAccessToken();
        if (!token) throw new Error('Not authenticated');
        const response = await fetch(REST_URL + '/orders?select=*,order_items:order_items(*)&order=created_at.desc', {
            headers: restHeaders(token)
        });
        return handleResponse(response);
    }

    async function createOrder(orderData) {
        const token = getAccessToken();
        const user = getUser();

        // Generate order number
        const orderNumber = 'HOS-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

        const order = {
            user_id: user ? user.id : null,
            guest_email: orderData.email || null,
            order_number: orderNumber,
            status: 'pending',
            subtotal: orderData.subtotal,
            shipping: orderData.shipping,
            total: orderData.total,
            shipping_address: orderData.shipping_address || null,
            billing_address: orderData.billing_address || null,
            notes: orderData.notes || null
        };

        const headers = token ? restHeaders(token) : restHeaders();
        headers['Prefer'] = 'return=representation';

        const response = await fetch(REST_URL + '/orders', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(order)
        });
        const created = await handleResponse(response);
        const createdOrder = created[0];

        // Insert order items
        if (orderData.items && orderData.items.length > 0) {
            const items = orderData.items.map(function(item) {
                return {
                    order_id: createdOrder.id,
                    product_id: item.id || item.product_id,
                    product_name: item.name || item.product_name,
                    product_image: item.image || item.product_image || '',
                    size: item.size || null,
                    color: item.color || null,
                    quantity: item.quantity,
                    unit_price: item.price || item.unit_price,
                    line_total: (item.price || item.unit_price) * item.quantity
                };
            });

            await fetch(REST_URL + '/order_items', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(items)
            });
        }

        return createdOrder;
    }

    // ============================================================
    // WISHLIST METHODS
    // ============================================================

    async function getWishlist() {
        const token = getAccessToken();
        if (!token) throw new Error('Not authenticated');
        const response = await fetch(REST_URL + '/wishlists?select=*&order=created_at.desc', {
            headers: restHeaders(token)
        });
        return handleResponse(response);
    }

    async function addToWishlist(product) {
        const token = getAccessToken();
        if (!token) throw new Error('Not authenticated');
        const user = getUser();
        const response = await fetch(REST_URL + '/wishlists', {
            method: 'POST',
            headers: Object.assign({}, restHeaders(token), { 'Prefer': 'return=representation' }),
            body: JSON.stringify({
                user_id: user.id,
                product_id: product.id,
                product_name: product.name,
                product_image: product.image || '',
                product_price: product.price || 0
            })
        });
        return handleResponse(response);
    }

    async function removeFromWishlist(productId) {
        const token = getAccessToken();
        if (!token) throw new Error('Not authenticated');
        const response = await fetch(REST_URL + '/wishlists?product_id=eq.' + productId, {
            method: 'DELETE',
            headers: restHeaders(token)
        });
        if (!response.ok) throw new Error('Failed to remove from wishlist');
    }

    async function isInWishlist(productId) {
        const token = getAccessToken();
        if (!token) return false;
        try {
            const response = await fetch(REST_URL + '/wishlists?product_id=eq.' + productId + '&select=id', {
                headers: restHeaders(token)
            });
            const data = await handleResponse(response);
            return data.length > 0;
        } catch (e) {
            return false;
        }
    }

    // ============================================================
    // UI HELPERS
    // ============================================================

    function updateNavbar() {
        const user = getUser();
        const accountLink = document.querySelector('.nav-account-link');
        if (!accountLink) return;

        if (user) {
            accountLink.href = 'account.html';
            accountLink.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
            accountLink.title = 'My Account';
        } else {
            accountLink.href = 'login.html';
            accountLink.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
            accountLink.title = 'Sign In';
        }
    }

    // Auto-refresh session on page load
    async function init() {
        const session = getSession();
        if (session && session.expires_at) {
            const timeLeft = session.expires_at - Date.now() / 1000;
            if (timeLeft < 300) {
                await refreshSession();
            }
        }
        updateNavbar();
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ============================================================
    // PUBLIC API
    // ============================================================

    return {
        // Auth
        signUp: signUp,
        signIn: signIn,
        signOut: signOut,
        resetPassword: resetPassword,
        updatePassword: updatePassword,
        refreshSession: refreshSession,

        // Session
        isLoggedIn: isLoggedIn,
        getUser: getUser,
        getSession: getSession,
        getAccessToken: getAccessToken,

        // Profile
        getProfile: getProfile,
        updateProfile: updateProfile,

        // Addresses
        getAddresses: getAddresses,
        addAddress: addAddress,
        updateAddress: updateAddress,
        deleteAddress: deleteAddress,

        // Orders
        getOrders: getOrders,
        createOrder: createOrder,

        // Wishlist
        getWishlist: getWishlist,
        addToWishlist: addToWishlist,
        removeFromWishlist: removeFromWishlist,
        isInWishlist: isInWishlist,

        // UI
        updateNavbar: updateNavbar,

        // Config
        SUPABASE_URL: SUPABASE_URL
    };
})();
