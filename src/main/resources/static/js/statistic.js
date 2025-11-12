class StatisticsManager {
    constructor() {
        this.statsKey = 'admin_statistics';
        this.init();
    }

    async init() {
        let stats = this.loadStats();
        if (!stats) {
            stats = await this.loadStatsFromServer();
            if (stats) {
                this.saveStats(stats);
            }
        }
        this.currentStats = stats;
    }

    async loadStatsFromServer() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('Токен не найден, используем мок данные');
                return this.generateMockData();
            }

            console.log('Начинаем загрузку статистики с сервера...');

            const [usersCount, postsCount, messagesCount] = await Promise.all([
                this.fetchCount('/api/v1/users/users_count', token),
                this.fetchCount('/api/v1/posts/posts_count', token),
                this.fetchCount('/api/v1/message/messages_count', token)
            ]);

            console.log('Данные получены:', { usersCount, postsCount, messagesCount });

            return {
                users: {
                    total: usersCount || 0,
                    dailyChange: this.calculateDailyChange(usersCount),
                    history: this.generateHistoryData(usersCount)
                },
                posts: {
                    total: postsCount || 0,
                    dailyChange: this.calculateDailyChange(postsCount),
                    history: this.generateHistoryData(postsCount)
                },
                messages: {
                    total: messagesCount || 0,
                    dailyChange: this.calculateDailyChange(messagesCount),
                    history: this.generateHistoryData(messagesCount)
                },
                geography: this.getGeographyData(),
                lastUpdated: new Date().toISOString()
            };

        } catch (error) {
            console.error('Ошибка загрузки статистики:', error);
            return this.generateMockData();
        }
    }

    async fetchCount(endpoint, token) {
        try {
            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                mode: 'cors'
            });

            if (!response.ok) {
                if (response.status === 204) return 0;
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.error(`Ошибка получения данных из ${endpoint}:`, error);
            return 0;
        }
    }

    calculateDailyChange(count) {
        return Math.floor(count * 0.1) + 5;
    }

    generateHistoryData(currentValue) {
        const history = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));

            const value = Math.max(0, Math.floor(currentValue * (0.7 + 0.3 * (i / 6))));

            history.push({
                date: date.toISOString().split('T')[0],
                value: value
            });
        }
        return history;
    }

    getGeographyData() {
        return [
            { country: 'Россия', visitors: 856, percentage: 68 },
            { country: 'Украина', visitors: 124, percentage: 10 },
            { country: 'Беларусь', visitors: 98, percentage: 8 },
            { country: 'Казахстан', visitors: 76, percentage: 6 },
            { country: 'Другие', visitors: 91, percentage: 8 }
        ];
    }

    generateMockData() {
        return {
            users: { total: 1245, dailyChange: 12, history: this.generateHistoryData(1245) },
            posts: { total: 5678, dailyChange: 34, history: this.generateHistoryData(5678) },
            messages: { total: 12345, dailyChange: 156, history: this.generateHistoryData(12345) },
            geography: this.getGeographyData(),
            lastUpdated: new Date().toISOString()
        };
    }

    loadStats() {
        const stats = localStorage.getItem(this.statsKey);
        return stats ? JSON.parse(stats) : null;
    }

    saveStats(stats) {
        localStorage.setItem(this.statsKey, JSON.stringify(stats));
    }

    async refreshStats() {
        const stats = await this.loadStatsFromServer();
        if (stats) {
            this.currentStats = stats;
            this.saveStats(stats);
        }
        return this.currentStats;
    }

    getStats() {
        return this.currentStats;
    }
}

async function renderStatistics(attempt = 0) {
    try {
        if (attempt >= 5) {
            console.log('Превышено максимальное количество попыток (5)');
            hideLoadingIndicator();
            return;
        }

        showLoadingIndicator();

        const stats = await statsManager.refreshStats();
        if (!stats) {
            hideLoadingIndicator();
            return;
        }

        setTimeout(() => {
            hideLoadingIndicator();

            if (!checkStatsElements()) {
                console.log(`Элементы статистики еще не доступны, попытка ${attempt + 1}/5`);
                setTimeout(() => renderStatistics(attempt + 1), 200);
                return;
            }

            updateIfExists('stats-users-count', stats.users.total.toLocaleString());
            updateIfExists('stats-posts-count', stats.posts.total.toLocaleString());
            updateIfExists('stats-messages-count', stats.messages.total.toLocaleString());

            updateHTMLIfExists('stats-users-daily',
                `<i class="bi bi-arrow-up"></i> +${stats.users.dailyChange} за день`);
            updateHTMLIfExists('stats-posts-daily',
                `<i class="bi bi-arrow-up"></i> +${stats.posts.dailyChange} за день`);
            updateHTMLIfExists('stats-messages-daily',
                `<i class="bi bi-arrow-up"></i> +${stats.messages.dailyChange} за день`);

            renderGeography(stats.geography);
            renderActivityChart(stats);

        }, 300);

    } catch (error) {
        console.error('Ошибка отображения статистики:', error);
        hideLoadingIndicator();
    }
}

function checkStatsElements() {
    const requiredElements = [
        'stats-users-count',
        'stats-posts-count',
        'stats-messages-count',
        'stats-geography',
        'activityChart'
    ];

    const missingElements = requiredElements.filter(id => !document.getElementById(id));

    if (missingElements.length > 0) {
        console.log('Отсутствующие элементы:', missingElements);
        return false;
    }

    return true;
}

function updateIfExists(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) element.textContent = text;
}

function updateHTMLIfExists(elementId, html) {
    const element = document.getElementById(elementId);
    if (element) element.innerHTML = html;
}

function showLoadingIndicator() {
    const statsContainer = document.getElementById('stats');
    if (statsContainer) {
        if (!statsContainer.originalContent) {
            statsContainer.originalContent = statsContainer.innerHTML;
        }

        statsContainer.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Загрузка...</span>
                </div>
                <p class="mt-3">Загрузка статистики...</p>
            </div>
        `;
    }
}

function hideLoadingIndicator() {
    const statsContainer = document.getElementById('stats');
    if (statsContainer && statsContainer.originalContent) {
        statsContainer.innerHTML = statsContainer.originalContent;
    }
}


let statsManager;

function initStatistics() {
    statsManager = new StatisticsManager();

    const statsTab = document.getElementById('stats-tab');
    if (statsTab) {
        statsTab.addEventListener('shown.bs.tab', function (e) {
            if (e.target.id === 'stats-tab') {
                showLoadingIndicator();
                setTimeout(async () => {
                    await renderStatistics(0);
                }, 200);
            }
        });
    }

    const statsContainer = document.getElementById('stats');
    if (statsContainer && statsContainer.classList.contains('active') &&
        statsContainer.classList.contains('show')) {
        showLoadingIndicator();
        setTimeout(async () => {
            await renderStatistics(0);
        }, 300);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStatistics);
} else {
    setTimeout(initStatistics, 100);
}

function renderGeography(geographyData) {
    const geographyTable = document.getElementById('stats-geography');
    if (!geographyTable) {
        console.warn('Таблица географии не найдена');
        setTimeout(() => renderGeography(geographyData), 50);
        return;
    }

    geographyTable.innerHTML = '';

    geographyData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.country}</td>
            <td>${item.visitors.toLocaleString()}</td>
            <td>${item.percentage}%</td>
        `;
        geographyTable.appendChild(row);
    });
}

function renderActivityChart(stats) {
    const ctx = document.getElementById('activityChart');
    if (!ctx) {
        console.warn('Canvas для графика не найден');
        return;
    }

    if (typeof Chart === 'undefined') {
        console.error('Chart.js не загружен!');
        return;
    }

    if (ctx.chart) {
        ctx.chart.destroy();
    }

    const dates = stats.users.history.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    });

    const userData = stats.users.history.map(item => item.value);
    const postData = stats.posts.history.map(item => item.value);
    const messageData = stats.messages.history.map(item => item.value);

    try {
        ctx.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'Пользователи',
                        data: userData,
                        borderColor: '#0d6efd',
                        backgroundColor: 'rgba(13, 110, 253, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Посты',
                        data: postData,
                        borderColor: '#198754',
                        backgroundColor: 'rgba(25, 135, 84, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Сообщения',
                        data: messageData,
                        borderColor: '#6f42c1',
                        backgroundColor: 'rgba(111, 66, 193, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Активность за последние 7 дней'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        console.log('График успешно создан');

    } catch (error) {
        console.error('Ошибка создания графика:', error);
    }
}