document.addEventListener('DOMContentLoaded', function () {
    let currentEditCommentModal = null;
    let currentPage = 0;
    const postsPerPage = 20;
    const token = localStorage.getItem('token');
    let currentUserId = null;

    let isPageLoading = false;
    let abortController = new AbortController();
    const requestCache = new Map();
    let lastRequestTime = 0;

    let currentCommentsPage = 0;
    const commentsPerPage = 20;
    let currentPostIdForComments = null;

    function debounce(func, timeout = 300) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => { func.apply(this, args); }, timeout);
        };
    }

    const debouncedLoadPosts = debounce(loadPosts, 500);

    const loadingOverlay = document.getElementById('loading-overlay');
     loadingOverlay.style.display = 'flex';

     Promise.all([
         getCurrentUser(),
         loadPosts(currentPage)
     ])
     .then(() => {

         loadingOverlay.style.display = 'none';
     })
     .catch(error => {
         console.error('Ошибка загрузки:', error);
         loadingOverlay.style.display = 'none';
         showErrorAlert('Произошла ошибка при загрузке страницы');
     });


    initThemeSwitcher();

    function initThemeSwitcher() {
        const themeSwitcher = document.createElement('div');
        themeSwitcher.className = 'theme-switcher';
        themeSwitcher.innerHTML = `
            <button id="lightTheme">Светлая</button>
            <button id="darkTheme">Темная</button>
            <button id="blueTheme">Голубая</button>
        `;
        document.body.insertBefore(themeSwitcher, document.getElementById('postsContainer'));

        document.getElementById('lightTheme').addEventListener('click', () => setTheme('light'));
        document.getElementById('darkTheme').addEventListener('click', () => setTheme('dark'));
        document.getElementById('blueTheme').addEventListener('click', () => setTheme('blue'));

        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
    }

    function setTheme(theme) {
        document.body.className = theme;
        localStorage.setItem('theme', theme);
    }

    function getCurrentUser() {
        const token = localStorage.getItem('token');
        if (!token) {
            currentUserId = null;
            return Promise.resolve(null);
        }

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
        })
        .then(user => {
            currentUserId = user.id;
            return user;
        })
        .catch(err => {
            console.error('Ошибка:', err);
            currentUserId = null;
            return null;
        });
    }

    function loadPosts(page = 0) {
        currentPage = page;
        if (isPageLoading) return Promise.reject('Загрузка уже выполняется');

        const now = Date.now();
        if (now - lastRequestTime < 1000) {
            return Promise.reject('Слишком частые запросы');
        }
        lastRequestTime = now;

        isPageLoading = true;
        loadingOverlay.style.display = 'flex';

        abortController.abort();
        abortController = new AbortController();

        const cacheKey = `posts-page-${page}`;
        if (requestCache.has(cacheKey)) {
            const cachedData = requestCache.get(cacheKey);
            renderPosts(cachedData._embedded.postDTOList);
            renderPagination(cachedData.page.totalPages, page);
            isPageLoading = false;
            loadingOverlay.style.display = 'none';
            return Promise.resolve(cachedData._embedded.postDTOList);
        }

        return new Promise((resolve, reject) => {
            getCurrentUser().then(() => {
                fetch(`/api/v1/posts?page=${page}&size=${postsPerPage}`, {
                    signal: abortController.signal
                })
                .then(response => {
                    if (!response.ok) throw new Error('Ошибка при загрузке постов');
                    return response.json();
                })
                .then(data => {
                    console.log('Полученные данные:', data);

                    if (!data._embedded || !data._embedded.postDTOList) {
                        console.warn('Посты отсутствуют или структура ответа неверна');
                        renderPosts([]);
                        renderPagination(data.page?.totalPages || 1, page);
                        resolve([]);
                        return;
                    }

                    requestCache.set(cacheKey, data);

                    renderPosts(data._embedded.postDTOList);
                    renderPagination(data.page.totalPages, page);
                    resolve(data._embedded.postDTOList);
                })
                .catch(error => {
                    if (error.name !== 'AbortError') {
                        console.error('Ошибка при загрузке постов:', error);
                        showErrorAlert('Произошла ошибка при загрузке постов');
                    }
                    reject(error);
                })
                .finally(() => {
                    isPageLoading = false;
                    loadingOverlay.style.display = 'none';
                });
            }).catch(error => {
                console.error('Ошибка при получении текущего пользователя:', error);
                reject(error);
            });
        });
    }

    function renderPosts(posts) {
        const postsContainer = document.getElementById('postsContainer');
        postsContainer.innerHTML = '';

        if (!posts || posts.length === 0) {
            postsContainer.innerHTML = '<p>Посты отсутствуют.</p>';
            return;
        }

        const postElements = posts.map(post => {
            const postElement = document.createElement('div');
            postElement.classList.add('post');
            postElement.setAttribute('data-post-id', post.id);

            postElement.innerHTML = `
                <div class="post-header">
                    <h3 class="post-title">${post.namePost}</h3>
                    <h4 class="post-theme">${post.theme || 'Без темы'}</h4>
                    <div class="post-controls">
                        <button class="edit-button" data-post-id="${post.id}">
                            <span class="edit-icon">✏️</span>
                            <span class="edit-text">Изменить</span>
                        </button>
                        <button class="delete-button" data-post-id="${post.id}">
                            <span class="delete-icon">🗑️</span>
                            <span class="delete-text">Удалить</span>
                        </button>
                    </div>
                </div>
                <div class="post-content-container">
                    <p class="post-content">${post.text}</p>
                </div>
                <div class="post-footer">
                    <div class="post-author-loading">Загрузка автора...</div>
                    <div class="post-actions">
                        <button class="like-button" data-post-id="${post.id}">
                            <span class="like-icon">🤍</span>
                            <span class="like-count" data-post-id="${post.id}">${post.likes || 0}</span>
                        </button>
                        <button class="comment-button" data-post-id="${post.id}">
                            <span class="comment-icon">💬</span>
                            <span class="comment-count" data-post-id="${post.id}">0</span>
                        </button>
                    </div>
                    <span class="post-date">Дата: ${new Date(post.dateOfPublication).toLocaleDateString()}</span>
                </div>
            `;

            if (currentUserId !== null && currentUserId === post.userId) {
                postElement.querySelector('.edit-button').style.display = 'flex';
                postElement.querySelector('.delete-button').style.display = 'flex';
            } else {
                postElement.querySelector('.post-controls').style.display = 'none';
            }

            postsContainer.appendChild(postElement);
            return postElement;
        });

        posts.forEach((post, index) => {
            const postElement = postElements[index];

            avatarUtils.renderPostAuthor(post).then(authorHtml => {
                const authorContainer = postElement.querySelector('.post-footer .post-author-loading');
                if (authorContainer) {
                    authorContainer.outerHTML = authorHtml;
                }
            }).catch(error => {
                console.error('Ошибка загрузки аватара:', error);
                const authorContainer = postElement.querySelector('.post-footer .post-author-loading');
                if (authorContainer) {
                    authorContainer.textContent = 'Неизвестный автор';
                }
            });

            loadFavoritePostsCount(post.id);
            if (currentUserId) {
                checkIfLiked(post.id);
            }
            loadCommentsCount(post.id);
        });

        setTimeout(() => {
            addPostClickHandlers();
            setupEditButtons();
            setupDeleteButtons();
            setupCommentsButtons();
            setupLikeButtons();
        }, 100);
    }

    function loadCommentsCount(postId) {
        fetch(`/api/v1/comments/count/${postId}`)
            .then(response => response.json())
            .then(count => {
                document.querySelector(`.comment-count[data-post-id="${postId}"]`).textContent = count;
            })
            .catch(error => console.error('Ошибка загрузки количества комментариев:', error));
    }

    function setupCommentExpanders() {
        document.querySelectorAll('.comment-content').forEach(content => {
            // Проверяем, если текст превышает 10 строк
            if (content.scrollHeight > content.offsetHeight) {
                const readMoreBtn = document.createElement('button');
                readMoreBtn.className = 'read-more-btn';
                readMoreBtn.textContent = 'Читать далее';
                readMoreBtn.addEventListener('click', () => {
                    content.classList.toggle('expanded');
                    readMoreBtn.textContent = content.classList.contains('expanded')
                        ? 'Свернуть'
                        : 'Читать далее';
                });
                content.parentNode.insertBefore(readMoreBtn, content.nextSibling);
            }
        });
    }

    function setupCommentsButtons() {
        document.querySelectorAll('.comment-button').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                const postElement = this.closest('.post');
                const postId = postElement ? postElement.querySelector('.edit-button').getAttribute('data-post-id') : null;
                if (!postId) {
                    console.error('Post ID not found');
                    showErrorAlert('Не удалось определить пост');
                    return;
                }
                currentPostIdForComments = postId;
                currentCommentsPage = 0;
                openComments(postId, currentCommentsPage);
            });
        });
    }

    function setupLikeButtons() {
        document.querySelectorAll('.like-button').forEach(button => {
            button.onclick = null;

            button.addEventListener('click', function(e) {
                e.stopPropagation();
                const postId = this.getAttribute('data-post-id');

                if (!postId) {
                    console.error('Post ID not found', this);
                    return;
                }

                const token = localStorage.getItem('token');
                if (!token) {
                    showAuthModal();
                    return;
                }

                toggleLike(postId, token);
            });
        });
    }

    function toggleLike(postId, token) {
        if (!postId) {
                console.error('Post ID is missing');
                return;
        }
        fetch('/api/v1/posts/put_like?postId=' + postId, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) showAuthModal();
            return response.json();
        })
        .then(data => {

            document.querySelector(`.like-count[data-post-id="${postId}"]`).textContent = data.count;

            updateLikeButtonState(postId, data.liked);
        })
        .catch(error => {
            console.error('Ошибка:', error);
            showErrorAlert(error.message);
        });
    }

    function checkIfLiked(postId) {
        const token = localStorage.getItem('token');
        if (!token) return;

        fetch(`/api/v1/posts/is_liked?postId=${postId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) throw new Error('Ошибка проверки лайка');
            return response.json();
        })
        .then(data => {
            updateLikeButtonState(postId, data);
        })
        .catch(error => console.error('Ошибка проверки лайка:', error));
    }

    function updateLikeButtonState(postId, isLiked) {
        const likeButton = document.querySelector(`.like-button[data-post-id="${postId}"]`);
        const likeIcon = likeButton.querySelector('.like-icon');

        if (isLiked) {
            likeButton.classList.add('liked');
            likeIcon.textContent = '❤️';
        } else {
            likeButton.classList.remove('liked');
            likeIcon.textContent = '🤍';
        }
    }

    function loadFavoritePostsCount(postId) {
        fetch(`/api/v1/posts/count/${postId}`)
            .then(response => {
                if (!response.ok) throw new Error('Ошибка загрузки количества лайков');
                return response.json();
            })
            .then(count => {
                const likeCountElement = document.querySelector(`.like-count[data-post-id="${postId}"]`);
                if (likeCountElement) {
                    likeCountElement.textContent = count;
                }
            })
            .catch(error => console.error('Ошибка загрузки количества лайков:', error));
    }

    function openComments(postId, page = 0) {
        if (!postId || isNaN(postId)) {
            console.error('Invalid postId:', postId);
            showErrorAlert('Неверный идентификатор поста');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            showAuthModal();
            return;
        }

        getCurrentUser().then(user => {
            fetch(`/api/v1/comments/${postId}/comments_of_post?page=${page}&size=${commentsPerPage}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    if (response.status === 403) {
                        throw new Error('Доступ запрещен');
                    } else if (response.status === 401) {
                        throw new Error('Требуется авторизация');
                    } else if (response.status === 404) {
                        throw new Error('Комментарии не найдены');
                    } else {
                        throw new Error(`Ошибка сервера: ${response.status}`);
                    }
                }
                return response.json();
            })
            .then(data => {
                console.log('Received comments data:', data);

                const formattedData = {
                    comments: data._embedded?.commentDTOList || [],
                    pageData: data.page || { number: 0, totalPages: 1 },
                    currentUserId: user?.id || null
                };

                showCommentsModal(postId, formattedData);
            })
            .catch(error => {
                console.error('Ошибка:', error);
                showErrorAlert(error.message);
            });
        });
    }




    async function showCommentsModal(postId, commentsData) {
        let modalElement = document.getElementById('commentsModal');
        if (modalElement) {
            modalElement.remove();
        }

        if (!commentsData) {
            commentsData = {
                comments: [],
                pageData: { number: 0, totalPages: 1 },
                currentUserId: currentUserId
            };
        }

        const { comments = [], pageData = { number: 0, totalPages: 1 }, currentUserId: currentUserId } = commentsData;
        const currentPostIdForComments = postId;
        let currentCommentsPage = pageData.number;

        const commentsHTML = await Promise.all(comments.map(async comment => {
            const authorHtml = await avatarUtils.renderCommentAuthor(comment);

            return `
                <div class="comment" data-comment-id="${comment.id}">
                    <div class="comment-header">
                        ${authorHtml}
                        ${currentUserId === comment.userId ? `
                        <div class="comment-controls">
                            <button class="edit-comment-button" data-comment-id="${comment.id}">
                                <span class="edit-icon">✏️</span>
                            </button>
                            <button class="delete-comment-button" data-comment-id="${comment.id}">
                                <span class="delete-icon">🗑️</span>
                            </button>
                        </div>
                        ` : ''}
                        <span class="comment-date">
                            ${new Date(comment.dateOfPublication).toLocaleString()}
                        </span>
                    </div>
                    <div class="comment-content">
                        ${comment.text}
                    </div>
                    <div class="comment-actions">
                        <button class="comment-like-button" data-comment-id="${comment.id}">
                            <span class="like-icon">🤍</span>
                            <span class="like-count">${comment.likes || 0}</span>
                        </button>
                    </div>
                </div>
            `;
        }));

        const modalHTML = `
        <div class="modal fade" id="commentsModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Комментарии</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="comments-container">
                            ${commentsHTML.join('') || '<p>Пока нет комментариев</p>'}
                        </div>

                        <div class="comments-pagination mt-3">
                            <button class="btn btn-outline-secondary ${pageData.number === 0 ? 'disabled' : ''}"
                                    id="prevCommentsPage">← Назад</button>
                            <span class="mx-2">Страница ${pageData.number + 1} из ${pageData.totalPages}</span>
                            <button class="btn btn-outline-secondary ${pageData.number >= pageData.totalPages - 1 ? 'disabled' : ''}"
                                    id="nextCommentsPage">Вперед →</button>
                        </div>

                        <div class="add-comment-form mt-3">
                            <textarea class="form-control" id="newCommentText" rows="3"
                                    placeholder="Добавить комментарий..."></textarea>
                            <button class="btn btn-primary mt-2" id="submitComment">Отправить</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = new bootstrap.Modal(document.getElementById('commentsModal'));
        document.getElementById('commentsModal').addEventListener('hidden.bs.modal', closeAllModals);
        modal.show();

        document.getElementById('prevCommentsPage')?.addEventListener('click', () => {
            if (currentCommentsPage > 0) {
                currentCommentsPage--;
                openComments(currentPostIdForComments, currentCommentsPage);
            }
        });

        document.getElementById('nextCommentsPage')?.addEventListener('click', () => {
            if (currentCommentsPage < pageData.totalPages - 1) {
                currentCommentsPage++;
                openComments(currentPostIdForComments, currentCommentsPage);
            }
        });

        document.getElementById('submitComment')?.addEventListener('click', () => {
            const commentText = document.getElementById('newCommentText').value.trim();
            if (commentText) {
                addComment(postId, commentText);
            }
        });

        setupCommentLikeButtons();

        comments.forEach(comment => {
            if (currentUserId) {
                checkIfCommentLiked(comment.id);
            }
            loadCommentLikesCount(comment.id);
        });

        setupDeleteCommentsButtons();
        setupCommentsEditButtons();
    }

    function addComment(postId, text) {
        const token = localStorage.getItem('token');
        if (!token) {
            showAuthModal();
            return;
        }

         const commentData = {
            text: text,
            postId: postId
        };

        fetch(`/api/v1/comments/write_comment/${postId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(commentData)
        })
        .then(response => {
            if (response.ok) {
                loadCommentsCount(postId);
                document.getElementById('newCommentText').value = '';
                openComments(postId, currentCommentsPage);
            } else {
                throw new Error('Ошибка при добавлении комментария');
            }
        })
        .catch(error => {
            console.error('Ошибка:', error);
            showErrorAlert(error.message);
        });
    }

    function setupCommentLikeButtons() {
        document.querySelectorAll('.comment-like-button').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                const commentId = this.getAttribute('data-comment-id');
                if (!commentId) {
                    console.error('Comment ID not found');
                    showErrorAlert('Не удалось определить комментарий');
                    return;
                }

                const token = localStorage.getItem('token');
                if (!token) {
                    showAuthModal();
                    return;
                }

                toggleCommentLike(commentId, token);
            });
        });
    }

    function toggleCommentLike(commentId, token) {
        fetch('/api/v1/comments/put_like?commentId=' + commentId, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) showAuthModal();
            return response.json();
        })
        .then(data => {

            document.querySelector(`.comment-like-button[data-comment-id="${commentId}"] .like-count`)
                .textContent = data.count;

            updateCommentLikeButtonState(commentId, data.liked);
        })
        .catch(error => {
            console.error('Ошибка:', error);
            showErrorAlert(error.message);
        });
    }

    function checkIfCommentLiked(commentId) {
        const token = localStorage.getItem('token');
        if (!token) return;

        fetch(`/api/v1/comments/is_liked?commentId=${commentId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) throw new Error('Ошибка проверки лайка комментария');
            return response.json();
        })
        .then(isLiked => {
            updateCommentLikeButtonState(commentId, isLiked);
        })
        .catch(error => console.error('Ошибка проверки лайка комментария:', error));
    }

    function updateCommentLikeButtonState(commentId, isLiked) {
        const likeButton = document.querySelector(`.comment-like-button[data-comment-id="${commentId}"]`);
        const likeIcon = likeButton.querySelector('.like-icon');

        if (isLiked) {
            likeButton.classList.add('liked');
            likeIcon.textContent = '❤️';
        } else {
            likeButton.classList.remove('liked');
            likeIcon.textContent = '🤍';
        }
    }

    function loadCommentLikesCount(commentId) {
        fetch(`/api/v1/comments/like/count/${commentId}`)
            .then(response => {
                if (!response.ok) throw new Error('Ошибка загрузки количества лайков комментария');
                return response.json();
            })
            .then(count => {
                const likeCountElement = document.querySelector(`.comment-like-button[data-comment-id="${commentId}"] .like-count`);
                if (likeCountElement) {
                    likeCountElement.textContent = count;
                }
            })
            .catch(error => console.error('Ошибка загрузки количества лайков комментария:', error));
    }

    function setupDeleteCommentsButtons() {
        document.querySelectorAll('.delete-comment-button').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                const commentId = this.getAttribute('data-comment-id');
                showDeleteCommentConfirmationModal(commentId);
            });
        });
    }

    function showDeleteCommentConfirmationModal(commentId) {
        let modalElement = document.getElementById('deleteCommentConfirmationModal');

        if(modalElement) {
            modalElement.remove();
        }

        const deleteModalHTML = `
            <div class="modal fade" id="deleteCommentConfirmationModal" tabindex="-1" aria-labelledby="deleteCommentModalLabel" aria-hidden="true">
              <div class="modal-dialog">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title" id="deleteCommentModalLabel">Удаление комментария</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div class="modal-body">
                    <p>Вы уверены, что хотите удалить этот комментарий? Это действие нельзя отменить.</p>
                  </div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
                    <button type="button" class="btn btn-danger" id="confirmDeleteCommentButton">Удалить</button>
                  </div>
                </div>
              </div>
            </div>
          `;

        document.body.insertAdjacentHTML('beforeend', deleteModalHTML);

        const modal = new bootstrap.Modal(document.getElementById('deleteCommentConfirmationModal'));
        modal.show();

        document.getElementById('confirmDeleteCommentButton').addEventListener('click', () => {
            fetchCommentForDelete(commentId)
            modal.hide();
        });
    }

    function fetchCommentForDelete(commentId) {
            const token = localStorage.getItem('token');
            if (!token) {
                showAuthModal();
                return;
            }
            fetch(`/api/v1/comments/delete_comment/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if(response.ok) {
                    showSuccessAlert('Комментарий удален');

                    openComments(currentPostIdForComments, currentCommentsPage);

                    loadCommentsCount(currentPostIdForComments);
                } else if (response.status == 403) {
                    throw new Error('Недостаточно прав для удаления');
                } else {
                    throw new Error('Ошибка при удалении комментария');
                }
            })
            .catch(error => {
                console.error('Ошибка:', error);
                showErrorAlert(error.message);
            });
        }

    function setupCommentsEditButtons() {
        document.removeEventListener('click', handleEditCommentClick);
        document.addEventListener('click', handleEditCommentClick);
    }

    function handleEditCommentClick(e) {
        if (e.target.closest('.edit-comment-button')) {
            e.stopPropagation();
            const button = e.target.closest('.edit-comment-button');
            const commentId = button.getAttribute('data-comment-id');

            if (!commentId) {
                console.error('Comment ID not found');
                showErrorAlert('Не удалось определить комментарий');
                return;
            }

            fetchCommentForEdit(commentId);
        }
    }

    function fetchCommentForEdit(commentId) {
        const token = localStorage.getItem('token');
        if (!token) {
            showAuthModal();
            return;
        }

        fetch(`/api/v1/comments/${commentId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(response.status === 403 ?
                    'Недостаточно прав для редактирования' :
                    'Ошибка при загрузке комментария');
            }
            return response.json();
        })
        .then(comment => {
            showEditCommentModal(comment);
        })
        .catch(error => {
            console.error('Ошибка:', error);
            showErrorAlert(error.message);
        });
    }

    function showEditCommentModal(comment) {

        if (currentEditCommentModal) {
            currentEditCommentModal.hide();
            currentEditCommentModal = null;
        }

        const modalHTML = `
        <div class="modal fade" id="editCommentModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Редактирование комментария</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <textarea id="editCommentText" class="form-control" rows="5">${comment.text}</textarea>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
                        <button type="button" class="btn btn-primary" id="saveCommentEdit">Сохранить</button>
                    </div>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        currentEditCommentModal = new bootstrap.Modal(document.getElementById('editCommentModal'));
        currentEditCommentModal.show();

        const saveHandler = () => {
            const newText = document.getElementById('editCommentText').value.trim();
            if (newText && newText !== comment.text) {
                updateComment(comment.id, newText);
                currentEditCommentModal.hide();
            }
        };

        document.getElementById('saveCommentEdit').addEventListener('click', saveHandler);

        document.getElementById('editCommentModal').addEventListener('hidden.bs.modal', () => {
            document.getElementById('saveCommentEdit').removeEventListener('click', saveHandler);
            document.getElementById('editCommentModal').remove();
        });
    }

    function updateComment(commentId, newText) {
      const token = localStorage.getItem('token');
      if (!token) {
          showAuthModal();
          return;
      }

      fetch(`/api/v1/comments/update_comment/${commentId}`, {
          method: 'PUT',
          headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              text: newText
          })
      })
      .then(response => {
          if (!response.ok) {
              throw new Error('Ошибка при обновлении комментария');
          }
          return response.json();
      })
      .then(updatedComment => {
           const editModalElement = document.getElementById('editCommentModal');
           if (editModalElement) {
               const modalInstance = bootstrap.Modal.getInstance(editModalElement);
               if (modalInstance) {
                   modalInstance.hide();
               }

               setTimeout(() => {
                   editModalElement.remove();

                   document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());

                   resetBodyStyles();
               }, 150);
           }

           showSuccessAlert('Комментарий обновлен');

           openComments(currentPostIdForComments, currentCommentsPage);
       })
      .catch(error => {
          console.error('Ошибка:', error);
          showErrorAlert(error.message);
      });
  }

    function resetBodyStyles() {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        document.body.classList.remove('modal-open');
    }

    function setupEditButtons() {
        document.querySelectorAll('.edit-button').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                const postId = this.getAttribute('data-post-id');
                fetchPostForEdit(postId);
            });
        });
    }

    function fetchPostForEdit(postId) {
      const token = localStorage.getItem('token');
      if (!token) {
          showAuthModal();
          return;
      }
      fetch(`/api/v1/posts/${postId}`, {
          method: 'GET',
          headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
          }
      })
        .then(response => {
          if (!response.ok) {
              if (response.status === 404) {
                  throw new Error('Пост не найден');
              } else if (response.status === 401) {
                  throw new Error('Требуется авторизация');
              } else {
                  throw new Error('Ошибка сервера');
              }
          }
          return response.json();
        })
        .then(post => {
          showEditModal(post);
        })
        .catch(error => {
          console.error('Ошибка:', error);
              alert(error.message);
        });
  }

    function showDeleteConfirmationModal(postId) {
        let modalElement = document.getElementById('deleteConfirmationModal');

        if(modalElement) {
            modalElement.remove();
        }

        const deleteModalHTML = `
            <div class="modal fade" id="deleteConfirmationModal" tabindex="-1" aria-labelledby="deleteModalLabel" aria-hidden="true">
              <div class="modal-dialog">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title" id="deleteModalLabel">Удаление поста</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div class="modal-body">
                    <p>Вы уверены, что хотите удалить этот пост? Это действие нельзя отменить.</p>
                  </div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
                    <button type="button" class="btn btn-danger" id="confirmDeleteButton">Удалить</button>
                  </div>
                </div>
              </div>
            </div>
          `;

          document.body.insertAdjacentHTML('beforeend', deleteModalHTML);

          const modal = new bootstrap.Modal(document.getElementById('deleteConfirmationModal'));

          modal.show();

          document.getElementById('confirmDeleteButton').addEventListener('click', () => {
            deletePost(postId);
            modal.hide();
          });
    }

    function deletePost(postId) {
        const token = localStorage.getItem('token');
        if (!token) {
            showAuthModal();
            return;
        }

        if (!confirm('Вы уверены, что хотите удалить этот пост?')) {
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
            if(response.ok) {
                showSuccessAlert('Пост удален');

                setTimeout(() => {
                    window.location.reload();
                }, 500);

                const activePage = getCurrentPage();

                loadPosts(activePage);

            } else if (response.status == 403) {
                throw new Error('Недостаточно прав для удаления');
            } else if (response.status == 401) {
                localStorage.removeItem('token');
                window.location.href = "http://localhost:8080/authentication";
            } else {
                throw new Error('Ошибка при удалении поста');
            }
        })
        .catch(error => {
            console.error('Ошибка:', error);
            showErrorAlert(error.message);
        });
    }

    function showSuccessAlert(message) {
        alert(message);
    }

    function showErrorAlert(message) {
        alert(`Ошибка: ${message}`);
    }

    function setupDeleteButtons() {
        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                const postId = this.getAttribute('data-post-id');
                showDeleteConfirmationModal(postId);
            });
        });
    }

    function showEditModal(post) {
        let modalElement = document.getElementById('editPostModal');
        if (modalElement) modalElement.remove();

        const editModalHTML = `
            <div class="modal fade" id="editPostModal" tabindex="-1" aria-labelledby="editPostModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="editPostModalLabel">Редактирование поста</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="editPostForm">
                                <div class="mb-3">
                                    <label for="editPostTitle" class="form-label">Заголовок</label>
                                    <input type="text" class="form-control" id="editPostTitle" value="${post.namePost}" required>
                                </div>

                                <div class="mb-3">
                                    <label for="editPostContent" class="form-label">Текст поста</label>
                                    <textarea class="form-control" id="editPostContent" rows="5" required>${post.text}</textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
                            <button type="button" class="btn btn-primary" id="saveEditButton">Сохранить</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', editModalHTML);

        const modal = new bootstrap.Modal(document.getElementById('editPostModal'));
        modal.show();

        document.getElementById('saveEditButton').addEventListener('click', () => {
            saveEditedPost(post.id);
        });
    }

    function closeAllModals() {
          if (currentEditModal) {
              currentEditModal.hide();
              const editModal = document.getElementById('editPostModal');
              if (editModal) editModal.remove();
              currentEditModal = null;
          }

          if (currentDeleteModal) {
              currentDeleteModal.hide();
              const deleteModal = document.getElementById('deleteConfirmationModal');
              if (deleteModal) deleteModal.remove();
              currentDeleteModal = null;
          }

          setTimeout(() => {
              document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
              document.body.classList.remove('modal-open');
              document.body.style.paddingRight = '';
          }, 100);
      }

      function cleanUpModalRemnants() {
          const activeModals = document.querySelectorAll('.modal.show');
          if (activeModals.length === 0) {
              document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
              document.body.classList.remove('modal-open');
              document.body.style.paddingRight = '';
              document.querySelectorAll('.modal').forEach(modal => modal.remove());
          }
      }

    function saveEditedPost(postId) {
        const token = localStorage.getItem('token');
        if (!token) {
            showAuthModal();
            return;
        }

        const title = document.getElementById('editPostTitle').value.trim();
        const content = document.getElementById('editPostContent').value.trim();

        if (!title || !content) {
            showErrorAlert('Заголовок и текст поста не могут быть пустыми');
            return;
        }

        const updatedPost = {
            namePost: title,
            text: content
        };

        fetch(`/api/v1/posts/update_post/${postId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(updatedPost)
        })
        .then(response => {
            if (response.ok) {

                const modalElement = document.getElementById('editPostModal');
                if (modalElement) {
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    if (modal) modal.hide();

                    setTimeout(() => {
                        modalElement.remove();
                        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
                        document.body.classList.remove('modal-open');
                    }, 300);
                }

                showSuccessAlert('Пост успешно обновлен');
                setTimeout(() => {
                    window.location.reload();
                }, 500);

                // Получаем текущую страницу из пагинации
                const activePage = getCurrentPage();
                loadPosts(activePage);

            } else if (response.status === 401) {
                alert('Требуется авторизация');
                localStorage.removeItem('token');
                window.location.href = "http://localhost:8080/authentication";
            } else {
                throw new Error('Ошибка при обновлении поста');
            }
        })
        .catch(error => {
            console.error('Ошибка:', error);
            showErrorAlert('Не удалось обновить пост');
        });
    }

    function addPostClickHandlers() {
        const posts = document.querySelectorAll('.post');

        posts.forEach(post => {
            const content = post.querySelector('.post-content');
            const text = content.textContent.trim();

            if (text.length > 100) {
                post.addEventListener('click', () => {
                    content.classList.toggle('expanded');
                    post.classList.toggle('expanded');

                    if (post.classList.contains('expanded')) {
                        post.style.minHeight = post.scrollHeight + 'px';
                    } else {
                        post.style.minHeight = '200px';
                    }
                });
            } else {
                post.style.cursor = 'default';
            }
        });
    }

    function renderPagination(totalPages, currentPage) {
        const paginationContainer = document.getElementById('pagination');
        paginationContainer.innerHTML = '';

        if (totalPages <= 1) return;

        for (let i = 0; i < totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.className = `btn ${i === currentPage ? 'btn-primary' : 'btn-outline-primary'} me-2`;
            pageButton.textContent = i + 1;
            pageButton.addEventListener('click', () => {
                loadPosts(i);
            });
            paginationContainer.appendChild(pageButton);
        }
    }

    function setupButtons() {
        let lastClickTime = 0;

        document.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', (e) => {
                const now = Date.now();
                if (now - lastClickTime < 1000) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                lastClickTime = now;
            });
        });
    }

    function getCurrentPage() {

        const activePageButton = document.querySelector('.pagination .active');
        if (activePageButton) {
            return parseInt(activePageButton.textContent) - 1;
        }


        const urlParams = new URLSearchParams(window.location.search);
        const pageFromUrl = urlParams.get('page');
        if (pageFromUrl) {
            return parseInt(pageFromUrl);
        }


        return currentPage !== undefined ? currentPage : 0;
    }

    loadPosts(currentPage);
    setupButtons();

     window.renderPosts = renderPosts;
     window.renderPagination = renderPagination;
     window.loadDefaultPosts = function() {
        currentPage = 0;
        document.getElementById('pagination').style.display = 'block';
        loadPosts(currentPage);
    };

    window.renderSortedPosts = function(posts) {
    const postsContainer = document.getElementById('postsContainer');
    postsContainer.innerHTML = '';

    if (posts.length === 0) {
        postsContainer.innerHTML = '<p>Посты не найдены</p>';
        return;
    }

    const cacheKey = 'sorted-posts-' + JSON.stringify(sortState);
    requestCache.set(cacheKey, {
        _embedded: { postDTOList: posts },
        page: { totalPages: 1 }
    });

    renderPosts(posts);
    document.getElementById('pagination').style.display = 'none';
};

 window.loadDefaultPosts = function() {
    currentPage = 0;
    document.getElementById('pagination').style.display = 'block';
    loadPosts(currentPage);
 };

 try {
     window.renderPosts = renderPosts;
     window.renderPagination = renderPagination;
     window.loadDefaultPosts = function() {
         currentPage = 0;
         const paginationElement = document.getElementById('pagination');
         if (paginationElement) {
             paginationElement.style.display = 'block';
         }
         loadPosts(currentPage);
     };
     console.log('Функции успешно экспортированы в window');
 } catch (error) {
     console.error('Ошибка при экспорте функций:', error);
 }

});