async function fetchProtectedData() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('Токен не найден');
        return;
    }

    try {
        const response = await fetch('/api/v1/auth/protected', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка сервера');
        }

        const data = await response.json();
        console.log('Данные:', data);
    } catch (error) {
        console.error('Ошибка:', error);
        if (error.message.includes('403')) {
            localStorage.removeItem('token');
            window.location.href = '/login?error=session_expired';
        }
    }
}

// Вызываем функцию
fetchProtectedData();