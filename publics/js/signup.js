document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    const errorMsg = document.getElementById('error-message');

    errorMsg.classList.add('hidden');

    if (password !== passwordConfirm) {
        errorMsg.textContent = 'Les mots de passe ne correspondent pas';
        errorMsg.classList.remove('hidden');
        return;
    }

    try {
        await signup(email, password, name);
        window.location.href = 'index.html';
    } catch (error) {
        errorMsg.textContent = error.message;
        errorMsg.classList.remove('hidden');
    }
});
