// auth.js - Manejo de autenticación
const API_URL = 'http://localhost:3000/api';

class Auth {
    static getToken() {
        return localStorage.getItem('token');
    }

    static setToken(token) {
        localStorage.setItem('token', token);
    }

    static getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    static setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    }

    static logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    }

    static isAuthenticated() {
        return !!this.getToken();
    }

    static requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = '/';
            return false;
        }
        return true;
    }

    static async login(email, password) {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.mensaje || 'Error al iniciar sesión');
            }

            this.setToken(data.token);
            this.setUser(data.usuario);

            return data;
        } catch (error) {
            throw error;
        }
    }
}

// API Helper
class API {
    static async request(endpoint, options = {}) {
        const token = Auth.getToken();

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(`${API_URL}${endpoint}`, config);
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    Auth.logout();
                    throw new Error('Sesión expirada');
                }
                throw new Error(data.mensaje || 'Error en la petición');
            }

            return data;
        } catch (error) {
            throw error;
        }
    }

    static get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    static post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    static delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

// Utilidades
const Utils = {
    formatCurrency(amount) {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP'
        }).format(amount);
    },

    formatDate(date) {
        return new Date(date).toLocaleDateString('es-CL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    formatDateTime(date) {
        return new Date(date).toLocaleString('es-CL');
    },

    showAlert(message, type = 'success') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;

        const container = document.querySelector('.main-content') || document.body;
        container.insertBefore(alert, container.firstChild);

        setTimeout(() => alert.remove(), 5000);
    },

    showError(error) {
        this.showAlert(error.message || 'Ha ocurrido un error', 'danger');
    },

    async confirmDelete(message = '¿Estás seguro de eliminar este elemento?') {
        return confirm(message);
    }
};
