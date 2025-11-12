class GeneralStatsManager {
    constructor() {
        this.statsKey = 'general_stats';
    }

    async loadGeneralStats() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                this.showError('Требуется авторизация');
                return null;
            }

            const [usersCount, postsCount, commentsCount] = await Promise.all([
                this.fetchCount('/api/v1/users/count_users', token),
                this.fetchCount('/api/v1/posts/count_posts', token),
                this.fetchCount('/api/v1/comments/count_comments', token)
            ]);

            const stats = {
                users: usersCount,
                posts: postsCount,
                comments: commentsCount,
                updatedAt: new Date().toISOString()
            };

            this.saveStats(stats);
            return stats;

        } catch (error) {
            console.error('Ошибка загрузки общей статистики:', error);
            this.showError('Ошибка загрузки статистики');
            return null;
        }
    }

    async fetchCount(endpoint, token) {
        try {
            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 204) {
                console.log('Нет доступа к статистике');
                return 0;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.error(`Ошибка получения данных из ${endpoint}:`, error);
            return 0;
        }
    }

    saveStats(stats) {
        localStorage.setItem(this.statsKey, JSON.stringify(stats));
    }

    loadSavedStats() {
        const stats = localStorage.getItem(this.statsKey);
        return stats ? JSON.parse(stats) : null;
    }

    showError(message) {
        const container = document.getElementById('general-stats');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle"></i> ${message}
                </div>
            `;
        }
    }
}

const generalStatsManager = new GeneralStatsManager();

async function renderGeneralStats() {
    try {
        showGeneralStatsLoading();

        const stats = await generalStatsManager.loadGeneralStats();
        if (!stats) {
            const savedStats = generalStatsManager.loadSavedStats();
            if (savedStats) {
                updateGeneralStatsUI(savedStats);
            }
            return;
        }

        updateGeneralStatsUI(stats);

    } catch (error) {
        console.error('Ошибка отображения общей статистики:', error);
    }
}

function updateGeneralStatsUI(stats) {
    updateIfExists('total-users-count', stats.users.toLocaleString());
    updateIfExists('total-posts-count', stats.posts.toLocaleString());
    updateIfExists('total-comments-count', stats.comments.toLocaleString());

    const postsPerUser = stats.users > 0 ? (stats.posts / stats.users).toFixed(1) : 0;
    const commentsPerPost = stats.posts > 0 ? (stats.comments / stats.posts).toFixed(1) : 0;

    updateIfExists('posts-per-user', postsPerUser);
    updateIfExists('comments-per-post', commentsPerPost);

    const updateTime = new Date(stats.updatedAt).toLocaleString('ru-RU');
    updateIfExists('stats-update-time', updateTime);
}

function showGeneralStatsLoading() {
    const elements = [
        'total-users-count',
        'total-posts-count',
        'total-comments-count',
        'posts-per-user',
        'comments-per-post',
        'stats-update-time'
    ];

    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        }
    });
}

window.loadGeneralStats = function() {
    renderGeneralStats();
};

function initGeneralStats() {
    const generalStatsTab = document.getElementById('general-stats-tab');
    if (generalStatsTab) {
        generalStatsTab.addEventListener('click', function() {
            setTimeout(() => {
                renderGeneralStats();
            }, 100);
        });
    }

    const generalStatsContainer = document.getElementById('general-stats');
    if (generalStatsContainer && generalStatsContainer.classList.contains('active')) {
        setTimeout(() => {
            renderGeneralStats();
        }, 100);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initGeneralStats();

});

async function fetchCount(endpoint, token) {
    try {
        const response = await fetch(endpoint, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401 || response.status === 403) {
            showAuthModal();
            throw new Error('Доступ запрещен');
        }

        if (response.status === 204) {
            return 0;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();

    } catch (error) {
        console.error(`Ошибка получения данных из ${endpoint}:`, error);
        throw error;
    }
}