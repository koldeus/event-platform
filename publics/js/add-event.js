document.addEventListener('DOMContentLoaded', () => {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
        document.getElementById('login-required').classList.remove('hidden');
        document.getElementById('form-container').classList.add('hidden');
        return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.has('date')) {
        document.getElementById('date').value = params.get('date');
    }

    document.getElementById('add-event-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const date = document.getElementById('date').value;
        const time = document.getElementById('time').value;
        const location = document.getElementById('location').value;

        const errorMsg = document.getElementById('error-message');
        const successMsg = document.getElementById('success-message');

        errorMsg.classList.add('hidden');
        successMsg.classList.add('hidden');

        try {
            const response = await fetch('http://localhost:3000/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title,
                    description,
                    date,
                    time,
                    location,
                    userId: currentUser.id
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erreur lors de la création');
            }

            successMsg.classList.remove('hidden');
            document.getElementById('add-event-form').reset();

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } catch (error) {
            errorMsg.textContent = error.message;
            errorMsg.classList.remove('hidden');
        }
    });
});
