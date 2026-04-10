const Auth = {
    TOKEN_KEY: 'mih_token',

    init() {
        this.setupEventListeners();
        this.checkAuthState();
    },

    setupEventListeners() {
        // Toggle between Login and Register
        document.getElementById('switch-to-register')?.addEventListener('click', () => {
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('register-form').style.display = 'block';
        });

        document.getElementById('switch-to-login')?.addEventListener('click', () => {
            document.getElementById('login-form').style.display = 'block';
            document.getElementById('register-form').style.display = 'none';
        });

        // Submit Login
        document.getElementById('btn-login-submit')?.addEventListener('click', () => this.handleLogin());

        // Submit Register
        document.getElementById('btn-register-submit')?.addEventListener('click', () => this.handleRegister());

        // Logout
        document.getElementById('logout-btn')?.addEventListener('click', () => this.logout());
    },

    async handleLogin() {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        if (!username || !password) {
            alert("Please fill in all fields.");
            return;
        }

        try {
            // FastAPI OAuth2 expects form-data
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Login failed");
            }

            const data = await response.json();
            this.setToken(data.access_token);
            location.reload(); // Quickest way to re-init app with auth
        } catch (error) {
            alert(error.message);
        }
    },

    async handleRegister() {
        const full_name = document.getElementById('reg-fullname').value;
        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;

        if (!full_name || !username || !password) {
            alert("Please fill in all fields.");
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, full_name })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || "Registration failed");
            }

            alert("Registration successful! Please login.");
            document.getElementById('switch-to-login').click();
        } catch (error) {
            alert(error.message);
        }
    },

    setToken(token) {
        localStorage.setItem(this.TOKEN_KEY, token);
    },

    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },

    logout() {
        localStorage.removeItem(this.TOKEN_KEY);
        location.reload();
    },

    async checkAuthState() {
        const token = this.getToken();
        const authOverlay = document.getElementById('auth-overlay');
        const appContainer = document.getElementById('app-container');

        if (!token) {
            authOverlay.style.display = 'flex';
            appContainer.style.display = 'none';
            return;
        }

        try {
            const response = await fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                this.logout();
                return;
            }

            const user = await response.json();
            
            // UI setup for logged in user
            document.getElementById('user-display-name').textContent = user.full_name;
            document.getElementById('user-initials').textContent = user.full_name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase();

            authOverlay.style.display = 'none';
            appContainer.style.display = 'flex';
            
            // Trigger app load if authenticated
            if (window.App && typeof window.App.load === 'function') {
                window.App.load();
            }
        } catch (error) {
            console.error("Auth check failed:", error);
            this.logout();
        }
    }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => Auth.init());
