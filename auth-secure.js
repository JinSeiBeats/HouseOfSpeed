/* ================================================================
   HOUSE OF SPEED - SECURE AUTH CLIENT
   Client-side authentication WITHOUT exposed credentials
   All auth operations go through backend API proxy
   ================================================================ */

const HOS_AUTH = (function() {
    'use strict';

    const API_BASE = '/api/auth-proxy'; // Backend proxy endpoint
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

    function authHeaders() {
        const token = getAccessToken();
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }
        return headers;
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
    // AUTH METHODS (using backend proxy)
    // ============================================================

    async function signUp(email, password, firstName, lastName) {
        const response = await fetch(API_BASE + '/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                email: email,
                password: password,
                first_name: firstName || '',
                last_name: lastName || ''
            })
        });
        const data = await handleResponse(response);
        if (data.access_token) {
            saveSession(data);
        }
        return data;
    }

    async function signIn(email, password) {
        const response = await fetch(API_BASE + '/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email: email, password: password })
        });
        const data = await handleResponse(response);
        if (data.access_token) {
            saveSession(data);
        }
        return data;
    }

    async function signOut() {
        try {
            await fetch(API_BASE + '/signout', {
                method: 'POST',
                headers: authHeaders(),
                credentials: 'include'
            });
        } catch (e) {
            console.error('Logout error:', e);
        } finally {
            clearSession();
        }
    }

    async function refreshSession() {
        const session = getSession();
        if (!session || !session.refresh_token) {
            clearSession();
            return null;
        }
        try {
            const response = await fetch(API_BASE + '/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
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
        const response = await fetch(API_BASE + '/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });
        return handleResponse(response);
    }

    async function updatePassword(newPassword) {
        const response = await fetch(API_BASE + '/update-password', {
            method: 'POST',
            headers: authHeaders(),
            credentials: 'include',
            body: JSON.stringify({ password: newPassword })
        });
        return handleResponse(response);
    }

    // ============================================================
    // PROFILE METHODS
    // ============================================================

    async function getProfile() {
        const response = await fetch(API_BASE + '/profile', {
            headers: authHeaders(),
            credentials: 'include'
        });
        return handleResponse(response);
    }

    async function updateProfile(updates) {
        const response = await fetch(API_BASE + '/profile', {
            method: 'PATCH',
            headers: authHeaders(),
            credentials: 'include',
            body: JSON.stringify(updates)
        });
        return handleResponse(response);
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
            if (timeLeft < 300) { // Refresh if less than 5 minutes left
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

        // UI
        updateNavbar: updateNavbar
    };
})();
