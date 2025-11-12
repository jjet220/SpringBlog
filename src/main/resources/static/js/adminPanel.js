let currentUsersPage = 0;
const usersPerPage = 20;

let currentPostsPage = 0;
const postsPerPage = 20;

let currentChatsPage = 0;
const chatsPerPage = 20;

function loadUsers(page = 0) {
    const token = localStorage.getItem('token');
    if (!token) {
        showAuthModal();
        return;
    }

    fetch(`/api/v1/users/all_user?page=${page}&size=${usersPerPage}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Требуется авторизация');
            } else if (response.status === 403) {
                throw new Error('Недостаточно прав');
            } else {
                throw new Error('Ошибка загрузки пользователей');
            }
        }
        return response.json();
    })
    .then(data => {
        const users = data._embedded?.userDTOList || [];
        const pageData = data.page || { number: 0, totalPages: 1 };

        renderUsers(users, pageData);
    })
    .catch(error => {
        console.error('Ошибка:', error);
        showErrorAlert(error.message);
    });
}

async function renderUsers(users, pageInfo) {
    const usersTableBody = document.querySelector('#users tbody');
    usersTableBody.innerHTML = '';

    if (users.length === 0) {
        usersTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">Пользователи не найдены</td>
            </tr>
        `;
        return;
    }

    const userElements = await Promise.all(users.map(async user => {
        const userElement = document.createElement('tr');

        const avatarUrl = await getAvatarUrl(user.id);

        userElement.innerHTML = `
            <td>${user.id}</td>
            <td>
                <div class="d-flex align-items-center">
                    <img src="${avatarUrl}"
                         class="user-avatar me-2"
                         alt="Аватар"
                         style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;"
                         onerror="this.src='/images/R7iW4fmaKrA.png'">
                    <a href="http://localhost:8080/profile/${user.id}"
                       class="user-profile-link"
                       style="text-decoration: none; color: inherit; cursor: pointer;"
                       data-user-id="${user.id}">
                        ${user.name || 'Без имени'}
                    </a>
                </div>
            </td>
            <td>${user.email || 'Не указан'}</td>
            <td>${user.registrationDate ? new Date(user.registrationDate).toLocaleDateString() : 'Не указана'}</td>
            <td>
                <span class="badge ${user.active ? 'bg-success' : 'bg-danger'}">
                    ${user.active ? 'Заблокирован' : 'Активен'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-warning user-action-btn" title="Заблокировать" data-user-id="${user.id}">
                    <i class="bi bi-mic-mute"></i>
                </button>
                <button class="btn btn-sm btn-danger user-action-btn" title="Удалить" data-user-id="${user.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;

        return userElement;
    }));

    userElements.forEach(element => {
        usersTableBody.appendChild(element);
    });

    renderUsersPagination(pageInfo);

    setupUserActions();
}

function renderUsersPagination(pageInfo) {
    const paginationContainer = document.querySelector('#users + nav .pagination');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';

    if (pageInfo.totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    const prevButton = document.createElement('li');
    prevButton.className = `page-item ${pageInfo.number === 0 ? 'disabled' : ''}`;
    prevButton.innerHTML = `
        <a class="page-link" href="#" data-page="${pageInfo.number - 1}">Предыдущая</a>
    `;
    paginationContainer.appendChild(prevButton);

    for (let i = 0; i < pageInfo.totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${i === pageInfo.number ? 'active' : ''}`;
        pageItem.innerHTML = `
            <a class="page-link" href="#" data-page="${i}">${i + 1}</a>
        `;
        paginationContainer.appendChild(pageItem);
    }

    const nextButton = document.createElement('li');
    nextButton.className = `page-item ${pageInfo.number >= pageInfo.totalPages - 1 ? 'disabled' : ''}`;
    nextButton.innerHTML = `
        <a class="page-link" href="#" data-page="${pageInfo.number + 1}">Следующая</a>
    `;
    paginationContainer.appendChild(nextButton);

    paginationContainer.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(e.target.dataset.page);
            if (!isNaN(page)) {
                currentUsersPage = page;
                loadUsers(page);
            }
        });
    });
}

function getLikeCount(postId) {
    return fetch(`/api/v1/posts/count/${postId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка получения количества лайков');
        }
        return response.json();
    })
    .then(count => {
        return count;
    })
    .catch(error => {
        console.error('Ошибка:', error);
        return 0;
    });
}


function setupUserActions() {
    document.querySelectorAll('.user-action-btn.btn-danger').forEach(button => {
        button.addEventListener('click', (e) => {
            const userId = e.currentTarget.dataset.userId;
            if (userId) {
                deleteUser(userId);
            }
        });
    });

    document.querySelectorAll('.user-action-btn.btn-warning, .user-action-btn.btn-success').forEach(button => {
        button.addEventListener('click', (e) => {
            const userId = e.currentTarget.dataset.userId;
            if (userId) {
                console.log('Блокировка/разблокировка пользователя:', userId);
            }
        });
    });
}

function deleteUser(userId) {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        showAuthModal();
        return;
    }

    fetch(`/api/v1/users/delete_user/${userId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            showSuccessAlert('Пользователь успешно удален');

            setTimeout(() => {
                refreshCurrentTab();
            }, 500);

        } else {
            handleDeleteError(response);
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        showErrorAlert('Не удалось удалить пользователя');
    });
}


async function getAvatarUrl(userId) {
    try {
        const response = await fetch(`/api/v1/users/${userId}/avatar`);
        if (response.ok) {
            const blob = await response.blob();
            return URL.createObjectURL(blob);
        }
    } catch (error) {
        console.error('Ошибка загрузки аватара:', error);
    }
    return '/images/R7iW4fmaKrA.png';
}

function loadPostsAdmin(page = 0) {
    const token = localStorage.getItem('token');
    if (!token) {
        showAuthModal();
        return;
    }

    fetch(`/api/v1/posts?page=${page}&size=${postsPerPage}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Требуется авторизация');
            } else if (response.status === 403) {
                throw new Error('Недостаточно прав');
            } else {
                throw new Error('Ошибка загрузки постов');
            }
        }
        return response.json();
    })
    .then(data => {
        const posts = data._embedded?.postDTOList || [];
        const pageData = data.page || { number: 0, totalPages: 1 };

        renderPostsAdmin(posts, pageData);
    })
    .catch(error => {
        console.error('Ошибка:', error);
        showErrorAlert(error.message);
    });
}

async function renderPostsAdmin(posts, pageInfo) {
    const postsTableBody = document.querySelector('#posts tbody');
    postsTableBody.innerHTML = '';

    if (posts.length === 0) {
        postsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">Посты не найдены</td>
            </tr>
        `;
        return;
    }

    const postElements = await Promise.all(posts.map(async post => {
        const postElement = document.createElement('tr');

        const likeCount = await getLikeCount(post.id);

        const avatarUrl = await getAvatarUrl(post.userId);

        postElement.innerHTML = `
            <td>${post.id}</td>
            <td>${post.namePost || 'Без названия'}</td>
            <td>
                <div class="d-flex align-items-center">
                    <img src="${avatarUrl}"
                         class="user-avatar me-2"
                         alt="Аватар автора"
                         style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;"
                         onerror="this.src='/images/R7iW4fmaKrA.png'">
                    <a href="http://localhost:8080/profile/${post.userId}"
                       class="user-profile-link"
                       style="text-decoration: none; color: inherit; cursor: pointer;"
                       data-user-id="${post.userId}">
                        ${post.authorName || 'Неизвестный автор'}
                    </a>
                </div>
            </td>
            <td>${post.dateOfPublication ? new Date(post.dateOfPublication).toLocaleDateString() : 'Не указана'}</td>
            <td>${likeCount}</td> <!-- Используем актуальное количество лайков -->
            <td>
                <button class="btn btn-sm btn-info me-2 post-action-btn" title="Просмотреть" data-post-id="${post.id}">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-danger post-action-btn" title="Удалить" data-post-id="${post.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;

        return postElement;
    }));

    postElements.forEach(element => {
        postsTableBody.appendChild(element);
    });

    renderPostsPagination(pageInfo);
    setupPostActions();
}

function renderPostsPagination(pageInfo) {
    const postsContainer = document.getElementById('posts');
    if (!postsContainer) {
        console.error('Контейнер постов не найден');
        return;
    }

    let paginationContainer = postsContainer.querySelector('.pagination');
    let paginationList = null;

    if (!paginationContainer) {
        paginationContainer = document.createElement('nav');
        paginationContainer.setAttribute('aria-label', 'Page navigation');
        paginationContainer.className = 'pagination-container';

        paginationList = document.createElement('ul');
        paginationList.className = 'pagination justify-content-center';

        paginationContainer.appendChild(paginationList);
        postsContainer.appendChild(paginationContainer);
    } else {
        paginationList = paginationContainer.querySelector('ul');
        if (!paginationList) {
            paginationList = document.createElement('ul');
            paginationList.className = 'pagination justify-content-center';
            paginationContainer.innerHTML = ''; // Очищаем контейнер
            paginationContainer.appendChild(paginationList);
        }
    }

    paginationList.innerHTML = '';

    if (pageInfo.totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }

    paginationContainer.style.display = 'block';

    const prevButton = document.createElement('li');
    prevButton.className = `page-item ${pageInfo.number === 0 ? 'disabled' : ''}`;
    prevButton.innerHTML = `
        <a class="page-link" href="#" data-page="${pageInfo.number - 1}">Предыдущая</a>
    `;
    paginationList.appendChild(prevButton);

    for (let i = 0; i < pageInfo.totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${i === pageInfo.number ? 'active' : ''}`;
        pageItem.innerHTML = `
            <a class="page-link" href="#" data-page="${i}">${i + 1}</a>
        `;
        paginationList.appendChild(pageItem);
    }

    const nextButton = document.createElement('li');
    nextButton.className = `page-item ${pageInfo.number >= pageInfo.totalPages - 1 ? 'disabled' : ''}`;
    nextButton.innerHTML = `
        <a class="page-link" href="#" data-page="${pageInfo.number + 1}">Следующая</a>
    `;
    paginationList.appendChild(nextButton);

    paginationList.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(e.target.dataset.page);
            if (!isNaN(page)) {
                currentPostsPage = page;
                loadPostsAdmin(page);
            }
        });
    });
}

function setupPostActions() {
    document.querySelectorAll('.post-action-btn.btn-danger').forEach(button => {
        button.addEventListener('click', (e) => {
            const postId = e.currentTarget.dataset.postId;
            if (postId) {
                deletePostAdmin(postId);
            }
        });
    });

    document.querySelectorAll('.post-action-btn.btn-info').forEach(button => {
        button.addEventListener('click', (e) => {
            const postId = e.currentTarget.dataset.postId;
            if (postId) {
                viewPost(postId);
            }
        });
    });
}

function deletePostAdmin(postId) {
    if (!confirm('Вы уверены, что хотите удалить этот пост?')) {
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        showAuthModal();
        return;
    }

    fetch(`/api/v1/posts/delete_post/${postId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            showSuccessAlert('Пост успешно удален');

            setTimeout(() => {
                refreshCurrentTab();
            }, 500);

        } else {

            handleDeleteError(response);
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        showErrorAlert('Не удалось удалить пост');
    });
}

function handleDeleteError(response) {
    if (response.status === 401) {
        showErrorAlert('Требуется авторизация');
        localStorage.removeItem('token');
        window.location.href = "/authentication";
    } else if (response.status === 403) {
        showErrorAlert('Недостаточно прав для удаления');
    } else if (response.status === 404) {
        showErrorAlert('Элемент не найден');
    } else {
        showErrorAlert('Ошибка при удалении');
    }
}


function viewPost(postId) {
    window.open(`/post/${postId}`, '_blank');
}

document.addEventListener('DOMContentLoaded', function() {
    const postsTab = document.getElementById('posts-tab');
    if (postsTab) {
        postsTab.addEventListener('click', () => {
            loadPostsAdmin(currentPostsPage);
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const usersTab = document.getElementById('users-tab');
    if (usersTab) {
        usersTab.addEventListener('click', () => {
            loadUsers(currentUsersPage);
        });

        if (usersTab.classList.contains('active')) {
            loadUsers(currentUsersPage);
        }
    }
});

function loadChats(page = 0) {
    const token = localStorage.getItem('token');
    if (!token) {
        showAuthModal();
        return;
    }

    fetch(`/api/v1/chat/all?page=${page}&size=${chatsPerPage}`, { // Предполагаемый endpoint
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Требуется авторизация');
            } else if (response.status === 403) {
                throw new Error('Недостаточно прав');
            } else {
                throw new Error('Ошибка загрузки чатов');
            }
        }
        return response.json();
    })
    .then(data => {
        const chats = data._embedded?.chatDTOList || [];
        const pageData = data.page || { number: 0, totalPages: 1 };

        renderChats(chats, pageData);
    })
    .catch(error => {
        console.error('Ошибка:', error);
        showErrorAlert(error.message);
    });
}

async function renderChats(chats, pageInfo) {
    const chatsTableBody = document.querySelector('#chats tbody');
    chatsTableBody.innerHTML = '';

    if (chats.length === 0) {
        chatsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">Чаты не найдены</td>
            </tr>
        `;
        return;
    }

    const chatElements = await Promise.all(chats.map(async chat => {
        const chatElement = document.createElement('tr');

        const userName = chat.userName || 'Неизвестный создатель';
        const avatarUrl = await getAvatarUrl(chat.userId);

        chatElement.innerHTML = `
            <td>${chat.id}</td>
            <td>${chat.userId || 'Неизвестно'}</td>
            <td>
                <div class="d-flex align-items-center">
                    <img src="${avatarUrl}"
                         class="user-avatar me-2"
                         alt="Аватар создателя"
                         style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;"
                         onerror="this.src='/images/R7iW4fmaKrA.png'">
                     <a href="http://localhost:8080/profile/${chat.userId}"
                       class="user-profile-link"
                       style="text-decoration: none; color: inherit; cursor: pointer;"
                       data-user-id="${chat.userId}">
                        ${userName}
                    </a>
                </div>
            </td>
            <td>${chat.messageCount || 0}</td>
            <td>${chat.creationDate || 'Нет данных'}</td>
            <td>
                <button class="btn btn-sm btn-info me-2 chat-action-btn" title="Просмотреть" data-chat-id="${chat.id}">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-danger chat-action-btn" title="Удалить" data-chat-id="${chat.id}" data-user-id="${chat.userId}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;

        return chatElement;
    }));

    chatElements.forEach(element => {
        chatsTableBody.appendChild(element);
    });

    renderChatsPagination(pageInfo);
    setupChatActions();
}

async function getUserInfo(userId) {
    try {
        const response = await fetch(`/api/v1/users/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const user = await response.json();
            return {
                name: user.name,
                avatarUrl: await getAvatarUrl(userId)
            };
        }
    } catch (error) {
        console.error('Ошибка получения информации о пользователе:', error);
    }

    return {
        name: 'Неизвестный пользователь',
        avatarUrl: '/images/R7iW4fmaKrA.png'
    };
}

function renderChatsPagination(pageInfo) {
    const chatsContainer = document.getElementById('chats');
    if (!chatsContainer) return;

    let paginationContainer = chatsContainer.querySelector('.pagination-container');

    if (!paginationContainer) {
        paginationContainer = document.createElement('nav');
        paginationContainer.setAttribute('aria-label', 'Page navigation');
        paginationContainer.className = 'pagination-container';
        chatsContainer.appendChild(paginationContainer);
    }

    const paginationList = document.createElement('ul');
    paginationList.className = 'pagination justify-content-center';
    paginationList.innerHTML = '';

    if (pageInfo.totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }

    paginationContainer.style.display = 'block';

    const prevButton = document.createElement('li');
    prevButton.className = `page-item ${pageInfo.number === 0 ? 'disabled' : ''}`;
    prevButton.innerHTML = `<a class="page-link" href="#" data-page="${pageInfo.number - 1}">Предыдущая</a>`;
    paginationList.appendChild(prevButton);

    for (let i = 0; i < pageInfo.totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${i === pageInfo.number ? 'active' : ''}`;
        pageItem.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i + 1}</a>`;
        paginationList.appendChild(pageItem);
    }

    const nextButton = document.createElement('li');
    nextButton.className = `page-item ${pageInfo.number >= pageInfo.totalPages - 1 ? 'disabled' : ''}`;
    nextButton.innerHTML = `<a class="page-link" href="#" data-page="${pageInfo.number + 1}">Следующая</a>`;
    paginationList.appendChild(nextButton);

    paginationList.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(e.target.dataset.page);
            if (!isNaN(page)) {
                currentChatsPage = page;
                loadChats(page);
            }
        });
    });

    paginationContainer.innerHTML = '';
    paginationContainer.appendChild(paginationList);
}

function setupChatActions() {
    document.querySelectorAll('.chat-action-btn.btn-danger').forEach(button => {
        button.addEventListener('click', (e) => {
            const chatId = e.currentTarget.dataset.chatId;
            const userId = e.currentTarget.dataset.userId;
            if (chatId) {
                deleteChat(chatId, userId);
            }
        });
    });


    document.querySelectorAll('.chat-action-btn.btn-info').forEach(button => {
        button.addEventListener('click', (e) => {
            const chatId = e.currentTarget.dataset.chatId;
            if (chatId) {
                viewChat(chatId);
            }
        });
    });

}

function deleteChat(chatId, userId) {
    if (!confirm('Вы уверены, что хотите удалить этот чат? Все сообщения будут удалены.')) {
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        showAuthModal();
        return;
    }

    fetch(`/api/v1/chat/delete/${chatId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            showSuccessAlert('Чат успешно удален');
            // Обновляем текущую вкладку
            setTimeout(() => {
                refreshCurrentTab();
            }, 500);
        } else if (response.status === 401) {
            throw new Error('Требуется авторизация');
        } else if (response.status === 403) {
            throw new Error('Недостаточно прав для удаления');
        } else if (response.status === 404) {
            throw new Error('Чат не найден');
        } else {
            throw new Error('Ошибка при удалении чата');
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        showErrorAlert(error.message);
    });
}

// Функция для просмотра чата
function viewChat(chatId) {
    // Здесь можно реализовать просмотр сообщений чата
    console.log('Просмотр чата:', chatId);
    // window.open(`/chat/${chatId}`, '_blank'); // Если есть страница просмотра
}

// Обновленная функция refreshCurrentTab
function refreshCurrentTab() {
    const activeTab = document.querySelector('.nav-link.active');
    if (!activeTab) return;

    const tabId = activeTab.id;

    switch(tabId) {
        case 'users-tab':
            loadUsers(currentUsersPage);
            break;
        case 'posts-tab':
            loadPostsAdmin(currentPostsPage);
            break;
        case 'chats-tab':
            loadChats(currentChatsPage);
            break;
        default:
            console.log('Неизвестная вкладка:', tabId);
    }
}

// Обновленная инициализация
document.addEventListener('DOMContentLoaded', function() {
    // Добавляем обработчик для вкладки чатов
    const chatsTab = document.getElementById('chats-tab');
    if (chatsTab) {
        chatsTab.addEventListener('click', () => {
            setTimeout(() => {
                loadChats(currentChatsPage);
            }, 100);
        });
    }

    // ... остальной код инициализации ...
});

document.addEventListener('DOMContentLoaded', function() {
    // Обработчики для вкладок Bootstrap
    const tabEl = document.querySelector('a[data-bs-toggle="tab"]');
    if (tabEl) {
        tabEl.addEventListener('shown.bs.tab', function (event) {
            const tabId = event.target.id;
            setTimeout(() => {
                switch(tabId) {
                    case 'users-tab':
                        loadUsers(currentUsersPage);
                        break;
                    case 'posts-tab':
                        loadPostsAdmin(currentPostsPage);
                        break;
                }
            }, 50);
        });
    }

    // Загружаем активную вкладку при загрузке страницы
    const activeTab = document.querySelector('.nav-link.active');
    if (activeTab) {
        const tabId = activeTab.id;
        setTimeout(() => {
            switch(tabId) {
                case 'users-tab':
                    loadUsers(currentUsersPage);
                    break;
                case 'posts-tab':
                    loadPostsAdmin(currentPostsPage);
                    break;
            }
        }, 100);
    }
});