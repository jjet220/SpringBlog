document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
   /* if (!token) {
        console.log('Пользователь не авторизован');
        return;
    }*/

    const userId = window.location.pathname.split('/').pop(); // ID из URL

    fetch(`http://localhost:8080/api/v1/users/profile/${userId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Ошибка при загрузке профиля');
        return response.json();
    })
    .then(user => {

        document.getElementById('userName').textContent = user.name;
        document.getElementById('userEmail').textContent = user.email;
        document.getElementById('userRegistrationDate').textContent =
            new Date(user.registrationDate).toLocaleDateString();

         updateAvatarDisplay(user.avatarBase64, user.avatarContentType, 'avatarContainer');
         updateAvatarDisplay(user.avatarBase64, user.avatarContentType, 'avatarPreview');

        if (user.avatarBase64) {
            const avatarImg = document.createElement('img');
            avatarImg.src = `data:${user.avatarContentType};base64,${user.avatarBase64}`;
            avatarImg.alt = 'Аватар пользователя';
            avatarImg.className = 'profile-avatar';
            document.getElementById('avatarContainer').appendChild(avatarImg);
        } else {
            document.getElementById('avatarContainer').innerHTML =
                '<div class="no-avatar">Аватар не установлен</div>';
        }

        return checkEditPermissions(userId, token);
    })
    .catch(err => {
        console.error('Ошибка:', err);
        alert('Не удалось загрузить профиль');
    });
});

function updateAvatarDisplay(avatarBase64, contentType, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (avatarBase64) {
        const avatarImg = document.createElement('img');
        avatarImg.src = `data:${contentType};base64,${avatarBase64}`;
        avatarImg.alt = 'Аватар пользователя';
        avatarImg.className = 'profile-avatar';
        container.appendChild(avatarImg);
    } else {
        container.innerHTML = '<div class="no-avatar">Аватар не установлен</div>';
    }
}

function checkEditPermissions(profileUserId, token) {
    return fetch('http://localhost:8080/api/v1/users/me', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Ошибка при загрузке данных пользователя');
        return response.json();
    })
    .then(currentUser => {
        const editTab = document.getElementById('edit-tab');
        const notificationsTab = document.getElementById('notifications-tab');
        const chatsTab = document.getElementById('chats-tab');

        if (currentUser.id.toString() === profileUserId.toString()) {
            editTab.style.display = 'block';
            document.getElementById('notifications-tab').style.display = 'block';
            document.getElementById('chats-tab').style.display = 'block';
        } else {
            editTab.style.display = 'none';
            document.getElementById('notifications-tab').style.display = 'none';
            document.getElementById('chats-tab').style.display = 'none';
        }
    })
    .catch(err => {
        console.error('Ошибка при проверке прав:', err);
        document.getElementById('edit-tab').style.display = 'none';
        document.getElementById('notifications-tab').style.display = 'none';
        document.getElementById('chats-tab').style.display = 'none';
    });
}

