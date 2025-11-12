document.getElementById('editProfileForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const token = localStorage.getItem('token');
    let oldPasswordValue = document.getElementById('editPassword').value;
    let userId = null;

    const avatarFile = document.getElementById('avatarInput').files[0];
    if (avatarFile) {
        const avatarFormData = new FormData();
        avatarFormData.append('file', avatarFile);

        updateUserWithAvatar(userId, avatarFormData, token)
            .catch(error => {
                console.error('Ошибка при обновлении аватара:', error);
                showErrorAlert('Ошибка при обновлении аватара: ' + error.message);
                throw error;
            });
    }

    const formData = {};
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (name) formData.name = name;
    if (email) formData.email = email;
    if (password) {
        formData.password = password;
        if (!oldPasswordValue) {
            showErrorAlert('Для изменения пароля введите старый пароль');
            return;
        }
    }

    if (Object.keys(formData).length === 0 && !avatarFile) {
        showErrorAlert('Нет данных для обновления');
        return;
    }

    getCurrentUser(token)
        .then(user => {
            if (!user) {
                throw new Error('Пользователь не найден');
            }
            userId = user.id;

            if (password) {
                return checkPassword(oldPasswordValue, token)
                    .then(isValid => {
                        if (!isValid) {
                            throw new Error('Неверный старый пароль');
                        }
                        return updateUser(userId, formData, token);
                    });
            } else {
                return updateUser(userId, formData, token);
            }
        })
        .then(() => {
            showSuccessAlert('Профиль успешно обновлен');
            window.location.reload();
        })
        .catch(error => {
            console.error('Ошибка:', error);
            showErrorAlert(error.message);
        });
});



function updateUserWithAvatar(userId, formData, token) {
    return fetch(`http://localhost:8080/api/v1/users/${userId}/avatarUP`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(`Ошибка ${response.status}: ${text || response.statusText}`);
            });
        }
        return response.json();
    });
}



document.getElementById('removeAvatarBtn').addEventListener('click', function() {
    if (!confirm('Вы уверены, что хотите удалить аватар?')) return;

    const token = localStorage.getItem('token');
    const userId = window.location.pathname.split('/').pop();

    fetch(`http://localhost:8080/api/v1/users/${userId}/avatarRM`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Ошибка при удалении аватара');
        showSuccessAlert('Аватар успешно удален');
        document.getElementById('currentAvatarPreview').innerHTML = '';
        document.getElementById('avatarInput').value = '';
        document.getElementById('avatarContainer').innerHTML =
            '<div class="no-avatar">Аватар не установлен</div>';
    })
    .catch(error => {
        console.error('Ошибка:', error);
        showErrorAlert(error.message);
    });
});

document.getElementById('avatarInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const preview = document.getElementById('avatarPreview');
    preview.innerHTML = '';

    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'profile-avatar';
            preview.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
});



function showErrorAlert(message) {
    alert(`Ошибка: ${message}`);
}
function showSuccessAlert(message) {
    alert(message);
}



function getCurrentUser(token) {
    return fetch('http://localhost:8080/api/v1/users/me', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(res => {
        if (!res.ok) throw new Error('Ошибка при загрузке данных пользователя');
        return res.json();
    });
}

function checkPassword(oldPassword, token) {
    return fetch('/api/v1/users/check_password', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'text/plain'
        },
        body: oldPassword
    })
    .then(response => {
        if (response.status === 404) {
            throw new Error('Пользователь не найден');
        }
        if (!response.ok) {
            throw new Error('Ошибка сервера');
        }
        return response.json();
    });
}

function updateUser(userId, formData, token) {
    return fetch(`/api/v1/users/update_user/${userId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) throw new Error('Ошибка при обновлении профиля');
        return response.json();
    });
}

