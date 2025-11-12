class SearchManager {
    constructor() {
        this.debounceTimer = null;
        this.debounceDelay = 1000;
        this.init();
    }

    init() {
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.handleSearchInput(e.target.value);
        });

        document.getElementById('search-button').addEventListener('click', () => {
            this.performSearch(document.getElementById('search-input').value);
        });

        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch(e.target.value);
            }
        });

        this.searchModal = new bootstrap.Modal(document.getElementById('searchModal'));
    }

    handleSearchInput(query) {
        clearTimeout(this.debounceTimer);

        if (query.length < 2) {
            this.clearResults();
            return;
        }

        this.debounceTimer = setTimeout(() => {
            this.performSearch(query);
        }, this.debounceDelay);
    }

    async performSearch(query) {
        if (!query || query.length < 2) return;

        const token = localStorage.getItem('token');
        if (!token) {
            this.showAuthWarning();
            return;
        }

        this.searchModal.show();
        this.showLoading();

        await Promise.all([
            this.searchUsers(query, token),
            this.searchPosts(query, token)
        ]);
    }

    async searchUsers(query, token) {
        try {
            const response = await fetch(`/api/v1/users/search_user?symbols=${encodeURIComponent(query)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const users = await response.json();
                this.renderUsersResults(users);
            } else {
                this.showError('users-results-container', 'Ошибка поиска пользователей');
            }
        } catch (error) {
            console.error('Ошибка поиска пользователей:', error);
            this.showError('users-results-container', 'Ошибка поиска');
        }
    }

    async searchPosts(query, token) {
        try {
            const response = await fetch(`/api/v1/posts/search_post?symbols=${encodeURIComponent(query)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const posts = await response.json();
                this.renderPostsResults(posts);
            } else {
                this.showError('posts-results-container', 'Ошибка поиска постов');
            }
        } catch (error) {
            console.error('Ошибка поиска постов:', error);
            this.showError('posts-results-container', 'Ошибка поиска');
        }
    }

    renderUsersResults(users) {
        const container = document.getElementById('users-results-container');

        if (!users || users.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-person-x" style="font-size: 2rem;"></i>
                    <p>Пользователи не найдены</p>
                </div>
            `;
            return;
        }

        container.innerHTML = users.map(user => `
            <div class="search-item" onclick="window.location.href='/profile/${user.id}'">
                <div class="d-flex align-items-center">
                    <img src="${user.avatarUrl || '/images/R7iW4fmaKrA.png'}"
                         class="user-avatar-sm me-3"
                         alt="Аватар"
                         onerror="this.src='/images/R7iW4fmaKrA.png'">
                    <div>
                        <h6 class="mb-1">${user.name}</h6>
                        <small class="text-muted">ID: ${user.id}</small>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderPostsResults(posts) {
        const container = document.getElementById('posts-results-container');

        if (!posts || posts.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-file-earmark-x" style="font-size: 2rem;"></i>
                    <p>Посты не найдены</p>
                </div>
            `;
            return;
        }

        container.innerHTML = posts.map(post => `
            <div class="search-item" onclick="window.open('/post/${post.id}', '_blank')">
                <div class="d-flex align-items-center">
                    <img src="${post.avatarUrl || '/images/R7iW4fmaKrA.png'}"
                         class="user-avatar-sm me-3"
                         alt="Аватар"
                         onerror="this.src='/images/R7iW4fmaKrA.png'">
                    <div>
                        <h6 class="mb-1">${post.namePost}</h6>
                        <small class="text-muted">ID поста: ${post.id}</small>
                    </div>
                </div>
            </div>
        `).join('');
    }

    showLoading() {
        const loadingHTML = `
            <div class="search-loading">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Загрузка...</span>
                </div>
                <p class="mt-2">Поиск...</p>
            </div>
        `;

        document.getElementById('users-results-container').innerHTML = loadingHTML;
        document.getElementById('posts-results-container').innerHTML = loadingHTML;
    }

    showError(containerId, message) {
        const container = document.getElementById(containerId);
        container.innerHTML = `
            <div class="text-center text-danger py-4">
                <i class="bi bi-exclamation-triangle" style="font-size: 2rem;"></i>
                <p>${message}</p>
            </div>
        `;
    }

    clearResults() {
        document.getElementById('users-results-container').innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="bi bi-search" style="font-size: 2rem;"></i>
                <p>Введите запрос для поиска пользователей</p>
            </div>
        `;

        document.getElementById('posts-results-container').innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="bi bi-search" style="font-size: 2rem;"></i>
                <p>Введите запрос для поиска постов</p>
            </div>
        `;
    }

    showAuthWarning() {
        alert('Для поиска необходимо авторизоваться');
    }
}

let searchManager;

document.addEventListener('DOMContentLoaded', function() {
    searchManager = new SearchManager();
});

