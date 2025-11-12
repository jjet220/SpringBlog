document.addEventListener('DOMContentLoaded', async function() {
    await initFriendSystem();
    setupFriendButtonHandlers();
});

async function initFriendSystem() {
    const token = localStorage.getItem('token');
    if (!token) {
        showAuthModal();
        return;
    }

    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return;

        const userId = window.location.pathname.split('/').pop();
        const isOwnProfile = currentUser.id.toString() === userId;

        if (!isOwnProfile) {
            await initFriendButtons(currentUser, userId);
        } else {
            await loadFriendsList(userId);
            await loadFriendRequests();
            setupNotificationsHandlers();
        }
    } catch (error) {
        console.error('Ошибка инициализации:', error);
    }
}

async function initFriendButtons(currentUser, profileUserId) {
    const addFriendBtn = document.getElementById('friend-btn-send');
    const removeFriendBtn = document.getElementById('friend-btn-remove');

    if (!addFriendBtn || !removeFriendBtn) return;

    try {
        const relationship = await checkRelationship(currentUser.id, profileUserId);

        // Если пользователи уже друзья (status = true)
        if (relationship.exists && relationship.isFriend) {
            addFriendBtn.style.display = 'none';
            removeFriendBtn.style.display = 'flex';
            removeFriendBtn.textContent = 'Удалить из друзей';
            removeFriendBtn.className = 'btn btn-danger';
        }
        // Если есть исходящая заявка (текущий пользователь инициатор)
        else if (relationship.exists && relationship.direction === 'outgoing') {
            addFriendBtn.style.display = 'none';
            removeFriendBtn.style.display = 'flex';
            removeFriendBtn.textContent = 'Отменить заявку';
            removeFriendBtn.className = 'btn btn-warning';
        }
        // Если есть входящая заявка (текущий пользователь получатель)
        else if (relationship.exists && relationship.direction === 'incoming') {
            addFriendBtn.style.display = 'none';
            removeFriendBtn.style.display = 'flex';
            removeFriendBtn.textContent = 'Отклонить заявку';
            removeFriendBtn.className = 'btn btn-warning';
        }

        else {
            addFriendBtn.style.display = 'flex';
            removeFriendBtn.style.display = 'none';
        }
    } catch (error) {
        console.error('Ошибка проверки отношений:', error);
    }
}

async function loadFriendsList(userId) {
    try {

        const response = await fetch(`/api/v1/users/find_friends/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(response.status === 404 ? 'Список друзей пуст' : 'Ошибка сервера');
        }

        const friends = await response.json();
        renderFriendsList(friends);
    } catch (error) {
        console.error('Ошибка загрузки друзей:', error);
        document.getElementById('friendsContainer').innerHTML =
            `<p class="text-muted">${error.message}</p>`;
    }
}

function renderFriendsList(friends) {
    const container = document.getElementById('friendsContainer');
    container.innerHTML = '';

    if (friends.length === 0) {
        container.innerHTML = '<p>У вас пока нет друзей</p>';
        return;
    }

    friends.forEach(friend => {
        const friendElement = document.createElement('div');
        friendElement.className = 'friend-item d-flex justify-content-between align-items-center mb-3 p-3 border rounded';
        friendElement.innerHTML = `
            <div>
                <a href="/profile/${friend.id}" class="h5">${friend.name}</a>
            </div>
            <div>
                <button class="btn btn-danger btn-sm remove-friend-btn" data-friend-id="${friend.id}">
                    <i class="bi bi-person-dash"></i> Удалить
                </button>
                <button class="btn btn-primary btn-sm message-friend-btn" data-friend-id="${friend.id}">
                    <i class="bi bi-chat"></i> Написать
                </button>
            </div>
        `;
        container.appendChild(friendElement);
    });
}

function setupFriendButtonHandlers() {
    const addFriendBtn = document.getElementById('friend-btn-send');
    const removeFriendBtn = document.getElementById('friend-btn-remove');

    if (addFriendBtn) {
        addFriendBtn.addEventListener('click', sendFriendRequest);
    }

    if (removeFriendBtn) {
        removeFriendBtn.addEventListener('click', async function() {
            const userId = window.location.pathname.split('/').pop();
            const currentUser = await getCurrentUser();
            const relationship = await checkRelationship(currentUser.id, userId);

            if (relationship.isFriend) {
                await removeFriend(userId);
            } else if (relationship.direction === 'outgoing') {
                await cancelFriendRequest(userId);
            } else if (relationship.direction === 'incoming') {
                await declineFriendRequest(userId);
            }
        });
    }

    document.addEventListener('click', async function(e) {
        const token = localStorage.getItem('token');
        if (!token) {
            showAuthModal();
            return;
        }

        if (e.target.closest('.remove-friend-btn')) {
            const friendId = e.target.closest('button').dataset.friendId;
            await removeFriend(friendId);
        }

        else if (e.target.closest('.message-friend-btn')) {
            const friendId = e.target.closest('button').dataset.friendId;
            startChatWithFriend(friendId);
        }
    });
}

async function sendFriendRequest() {
    const token = localStorage.getItem('token');
    if (!token) {
        showAuthModal();
        return;
    }

    const userId = window.location.pathname.split('/').pop();

    try {
        const response = await fetch('/api/v1/users/send_friend', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(Number(userId))
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Ошибка сервера');
        }

        alert('Запрос в друзья отправлен');
        await initFriendSystem();
    } catch (error) {
        console.error('Ошибка:', error);
        alert(`Ошибка: ${error.message}`);
    }
}


async function removeFriend(friendId) {
    try {
        const response = await fetch('/api/v1/users/remove_friend', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(friendId)
        });

        if (!response.ok) throw new Error(await response.text());

        alert('Пользователь удален из друзей');
        await initFriendSystem();
    } catch (error) {
        console.error('Ошибка:', error);
        alert(`Ошибка: ${error.message}`);
    }
}

async function cancelFriendRequest(friendId) {
    try {
        const response = await fetch('/api/v1/users/remove_friend', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(friendId)
        });

        if (!response.ok) throw new Error(await response.text());

        alert('Заявка в друзья отменена');
        await initFriendSystem();
    } catch (error) {
        console.error('Ошибка:', error);
        alert(`Ошибка: ${error.message}`);
    }
}

async function acceptFriendRequest(friendId) {
    try {
        const response = await fetch('/api/v1/users/accept_friend', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(friendId)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Неизвестная ошибка сервера');
        }

        alert('Заявка принята! Теперь вы друзья.');
        await loadFriendRequests();
        await initFriendSystem();
    } catch (error) {
        console.error('Ошибка:', error);
        alert(`Ошибка: ${error.message}`);
    }
}

async function declineFriendRequest(friendId) {
    try {
        const response = await fetch('/api/v1/users/remove_friend', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(friendId)
        });

        if (!response.ok) throw new Error(await response.text());

        alert('Заявка отклонена');
        await loadFriendRequests();
        await initFriendSystem();
    } catch (error) {
        console.error('Ошибка:', error);
        alert(`Ошибка: ${error.message}`);
    }
}


function startChatWithFriend(friendId) {
    window.location.href = `/chat/${friendId}`;
}

async function checkRelationship(userId, friendId) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`/api/v1/users/check_relationship?userId=${userId}&friendId=${friendId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Ошибка при проверке отношений');
        return await response.json();
    } catch (error) {
        console.error('Ошибка:', error);
        return { exists: false };
    }
}

async function loadFriendRequests() {
    try {
        const response = await fetch('/api/v1/users/incoming_friend_requests', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Ошибка при загрузке заявок');

        const requests = await response.json();
        renderFriendRequests(requests);
    } catch (error) {
        console.error('Ошибка загрузки заявок:', error);
        document.getElementById('friendRequestsList').innerHTML =
            `<div class="alert alert-warning">${error.message}</div>`;
    }
}

function renderFriendRequests(requests) {
    const container = document.getElementById('friendRequestsList');
    container.innerHTML = '';

    if (requests.length === 0) {
        container.innerHTML = '<div class="alert alert-info">Нет входящих заявок</div>';
        return;
    }

    requests.forEach(request => {
        const requestElement = document.createElement('div');
        requestElement.className = 'list-group-item d-flex justify-content-between align-items-center';
        requestElement.innerHTML = `
            <div>
                <a href="/profile/${request.id}" class="h5">${request.name}</a>
                <span class="text-muted">хочет добавить вас в друзья</span>
            </div>
            <div>
                <button class="btn btn-success btn-sm accept-request-btn" data-user-id="${request.id}">
                    <i class="bi bi-check-circle"></i> Принять
                </button>
                <button class="btn btn-danger btn-sm decline-request-btn" data-user-id="${request.id}">
                    <i class="bi bi-x-circle"></i> Отклонить
                </button>
            </div>
        `;
        container.appendChild(requestElement);
    });
}

function setupNotificationsHandlers() {
    document.addEventListener('click', async function(e) {
        const token = localStorage.getItem('token');
        if (!token) {
            showAuthModal();
            return;
        }

        if (e.target.closest('.accept-request-btn')) {
            const userId = e.target.closest('button').dataset.userId;
            await acceptFriendRequest(userId);
            await loadFriendRequests();
        }
        else if (e.target.closest('.decline-request-btn')) {
            const userId = e.target.closest('button').dataset.userId;
            await declineFriendRequest(userId);
            await loadFriendRequests();
        }
    });
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

        if (!response.ok) {throw new Error('Ошибка при загрузке данных пользователя');
            document.getElementById('friends-tab').style.display = 'none';
        }
        if (response.ok) document.getElementById('friends-tab').style.display = 'block';
        return await response.json();
    } catch (error) {
        console.error('Ошибка:', error);
        return null;
    }

}
