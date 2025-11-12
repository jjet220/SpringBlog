const avatarCache = {};

async function getAvatarUrl(userId, defaultAvatar = '/images/R7iW4fmaKrA.png') {
    // Проверка на валидный userId
    if (!userId || userId === 'false' || userId === 'null') {
        return defaultAvatar;
    }

    // Возвращаем из кеша, если есть
    if (avatarCache[userId]) {
        return avatarCache[userId];
    }

    try {
        const response = await fetch(`/api/v1/users/${userId}/avatar`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        // Кешируем URL
        avatarCache[userId] = url;

        return url;
    } catch (error) {
        console.error('Ошибка загрузки аватара:', error);
        return defaultAvatar;
    }
}

async function renderChatMessage(message, isMyMessage = false) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    if (isMyMessage) messageElement.classList.add('my-message');

    const timeString = new Date(message.publicationDateTime).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    // Получаем URL аватара (если userId доступен)
    const avatarUrl = message.userId ? await getAvatarUrl(message.userId) : '/images/R7iW4fmaKrA.png';

    messageElement.innerHTML = `
        <div class="message-header">
            <img src="${avatarUrl}"
                 class="message-author-avatar"
                 alt="Аватар"
                 onerror="this.src='/images/R7iW4fmaKrA.png'">
            <div class="message-author">${message.authorName}</div>
        </div>
        <div class="message-text">${message.text}</div>
        <div class="message-time">${timeString}</div>
    `;

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}


/**
 * Генерирует HTML для автора поста с аватаром
 * @param {Object} post - Объект поста
 * @returns {Promise<string>} HTML строка
 */
async function renderPostAuthor(post) {
    if (!post || !post.userId) {
        return '<span class="post-author">Неизвестный автор</span>';
    }

    const avatarUrl = await getAvatarUrl(post.userId);

    return `
        <span class="post-author">
            <img src="${avatarUrl}"
                 class="post-author-avatar"
                 alt="Аватар автора"
                 onerror="this.src='/images/R7iW4fmaKrA.png'">
            Автор: <a href="/profile/${post.userId}" class="author-link">${post.authorName || 'Неизвестный'}</a>
        </span>
    `;
}

async function renderCommentAuthor(comment) {
    if (!comment || !comment.userId) {
        return '<span class="comment-author">Неизвестный автор</span>';
    }

    const avatarUrl = await getAvatarUrl(comment.userId);

    return `
        <span class="comment-author">
            <img src="${avatarUrl}"
                 class="comment-author-avatar"
                 alt="Аватар автора"
                 onerror="this.src='/images/R7iW4fmaKrA.png'">
            <a href="/profile/${comment.userId}" class="author-link">${comment.userName || 'Неизвестный'}</a>
        </span>
    `;
}

/**
 * Очищает кеш аватаров
 */
function clearAvatarCache() {
    Object.values(avatarCache).forEach(url => {
        URL.revokeObjectURL(url);
    });
    Object.keys(avatarCache).forEach(key => {
        delete avatarCache[key];
    });
}

// Экспортируем функции в глобальную область видимости
window.avatarUtils = {
    getAvatarUrl,
    renderPostAuthor,
    renderCommentAuthor,
    clearAvatarCache
};

// Очищаем кеш при закрытии страницы
window.addEventListener('beforeunload', clearAvatarCache);



