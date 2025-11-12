document.addEventListener('DOMContentLoaded', async function () {
    const token = localStorage.getItem('token');
    if (!token) {
        showAuthModal();
        return;
    }

    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return;

        const userId = window.location.pathname.split('/').pop();

        // Получаем сами кнопки, а не их контейнеры
        const addFriendBtn = document.getElementById('friend-btn-send');
        const removeFriendBtn = document.getElementById('friend-btn-remove');

        if (!addFriendBtn || !removeFriendBtn) {
            console.error('Кнопки не найдены!');
            return;
        }

        if (currentUser.id.toString() === userId) {
            // Это профиль текущего пользователя - скрываем обе кнопки
            addFriendBtn.style.display = 'none';
            removeFriendBtn.style.display = 'none';
        } else {
            // Это чужой профиль - проверяем статус дружбы
            const isFriend = await checkFriendship(currentUser.id, userId);

            addFriendBtn.style.display = isFriend ? 'none' : 'flex';
            removeFriendBtn.style.display = isFriend ? 'flex' : 'none';
        }
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
    }
});

// Остальные функции остаются без изменений
async function checkFriendship(userId, friendId) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`/api/v1/users/check_friendship?userId=${userId}&friendId=${friendId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Ошибка при проверке дружбы');
        return await response.json();
    } catch (error) {
        console.error('Ошибка:', error);
        return false;
    }
}

async function getCurrentUser() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('http://localhost:8080/api/v1/users/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Ошибка при загрузке данных пользователя');
        return await response.json();
    } catch (error) {
        console.error('Ошибка:', error);
        return null;
    }
}