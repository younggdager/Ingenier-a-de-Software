// login.js
document.addEventListener('DOMContentLoaded', () => {
    // Si ya está autenticado, redirigir al dashboard
    if (Auth.isAuthenticated()) {
        window.location.href = '/pages/dashboard.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const loginBtn = document.getElementById('loginBtn');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Deshabilitar botón y mostrar loading
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="loading"></span> Iniciando sesión...';
        errorMessage.style.display = 'none';

        try {
            await Auth.login(email, password);
            window.location.href = '/pages/dashboard.html';
        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
            loginBtn.disabled = false;
            loginBtn.innerHTML = 'Iniciar Sesión';
        }
    });
});
