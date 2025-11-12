document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    let currentUserId = null;
    let currentEditCommentModal = null;
    let currentCommentsPage = 0;
    const commentsPerPage = 20;
    let currentPostIdForComments = null;

    let currentEditModal = null;
    let currentDeleteModal = null;

    if (!token) {
        window.location.href = '/login';
        return;
    }

    const postId = getPostIdFromUrl();

    function getPostIdFromUrl() {
            const pathParts = window.location.pathname.split('/');
            const postIdFromPath = pathParts[pathParts.length - 1];
            const urlParams = new URLSearchParams(window.location.search);
            const postIdFromParam = urlParams.get('id');
            return postIdFromPath || postIdFromParam;
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

     function loadSinglePost(postId) {
        const loadingElement = document.getElementById('loading');
        const errorElement = document.getElementById('error');
        const postContentElement = document.getElementById('post-content');

        loadingElement.style.display = 'flex';
        errorElement.style.display = 'none';
        postContentElement.style.display = 'none';

        return new Promise((resolve, reject) => {
            getCurrentUser().then(() => {
                const token = localStorage.getItem('token');

                if (!token) {
                    loadingElement.style.display = 'none';
                    errorElement.style.display = 'block';
                    errorElement.querySelector('p').textContent =
                        'Требуется авторизация для просмотра поста';
                    reject(new Error('No token'));
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
                    if (!response.ok) throw new Error('Пост не найден');
                    return response.json();
                })
                .then(post => {
                    renderSinglePost(post);
                    loadingElement.style.display = 'none';
                    postContentElement.style.display = 'block';
                    resolve(post);
                })
                .catch(error => {
                    console.error('Ошибка при загрузке поста:', error);
                    loadingElement.style.display = 'none';
                    errorElement.style.display = 'block';
                    reject(error);
                });
            }).catch(error => {
                console.error('Ошибка при получении текущего пользователя:', error);
                reject(error);
            });
        });
    }

    async function renderSinglePost(post) {
        const postsContainer = document.getElementById('postsContainer');
        postsContainer.innerHTML = '';

        const postElement = document.createElement('div');
        postElement.classList.add('post');
        postElement.setAttribute('data-post-id', post.id);

        const authorHtml = await renderPostAuthor(post);

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
                ${authorHtml}
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

        loadFavoritePostsCount(post.id);
        if (currentUserId) {
            checkIfLiked(post.id);
        }
        loadCommentsCount(post.id);

        setTimeout(() => {
            addPostClickHandlers();
            setupEditButtons();
            setupDeleteButtons();
            setupCommentsButtons();
            setupLikeButtons();
        }, 100);
    }


    if (postId) {
        loadSinglePost(postId);
    } else {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'block';
    }
    function setupLikeButtons() {

        document.querySelectorAll('.like-button').forEach(button => {
          const newButton = button.cloneNode(true);
          button.parentNode.replaceChild(newButton, button);
        });

        document.querySelectorAll('.like-button').forEach(button => {
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
        fetch('/api/v1/posts/put_like?postId=' + postId, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        .then(response => {
          if (!response.ok) throw new Error('Ошибка при установке лайка');
          return response.json();
        })
        .then(data => {
          document.querySelectorAll(`.like-button[data-post-id="${postId}"] .like-count`)
            .forEach(el => el.textContent = data.count);

          document.querySelectorAll(`.like-button[data-post-id="${postId}"] .like-icon`)
            .forEach(el => el.textContent = data.liked ? '❤️' : '🤍');
        })
        .catch(error => {
          console.error('Ошибка:', error);
          showErrorAlert(error.message);
        });
      }

      function updateLikeButtonState(postId, isLiked) {
          const likeButtons = document.querySelectorAll(`.like-button[data-post-id="${postId}"]`);

          likeButtons.forEach(likeButton => {
              const likeIcon = likeButton.querySelector('.like-icon');
              if (!likeIcon) return;

              if (isLiked) {
                  likeButton.classList.add('liked');
                  likeIcon.textContent = '❤️';
              } else {
                  likeButton.classList.remove('liked');
                  likeIcon.textContent = '🤍';
              }
          });
      }

      function checkIfLiked(postId) {
          const token = localStorage.getItem('token');
          if (!token) {
              updateLikeButtonState(postId, false);
              return;
          }

          fetch(`/api/v1/posts/is_liked?postId=${postId}`, {
              headers: {
                  'Authorization': `Bearer ${token}`
              }
          })
          .then(response => {
              if (!response.ok) {
                  updateLikeButtonState(postId, false);
                  throw new Error('Ошибка проверки лайка');
              }
              return response.json();
          })
          .then(data => {
              updateLikeButtonState(postId, data);
          })
          .catch(error => {
              console.error('Ошибка проверки лайка:', error);
              updateLikeButtonState(postId, false);
          });
      }

       function loadCommentsCount(postId) {
          fetch(`/api/v1/comments/count/${postId}`)
              .then(response => response.json())
              .then(count => {
                  document.querySelector(`.comment-count[data-post-id="${postId}"]`).textContent = count;
              })
              .catch(error => console.error('Ошибка загрузки количества комментариев:', error));
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

      function openComments(postId, page = 0) {
          const existingModal = document.getElementById('commentsModal');
          if (existingModal) {
              const bsModal = bootstrap.Modal.getInstance(existingModal);
              if (bsModal) {
                  bsModal.hide();
              }
              existingModal.remove();
          }

          cleanUpModalRemnants();

          setTimeout(() => {
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
                      if (!response.ok) throw new Error('Ошибка загрузки комментариев');
                      return response.json();
                  })
                  .then(data => {
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
          }, 100);
      }

      async function showCommentsModal(postId, commentsData) {

               if (document.getElementById('commentsModal')) {
                  return;
               }

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
               document.getElementById('commentsModal').addEventListener('hidden.bs.modal', closeAllModals);
               const modal = new bootstrap.Modal(document.getElementById('commentsModal'));
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
              if (!response.ok) {
                  throw new Error('Ошибка при добавлении комментария');
              }
              return response.json();
          })
          .then(newComment => {
              document.getElementById('newCommentText').value = '';

              const commentsModalElement = document.getElementById('commentsModal');
              if (commentsModalElement) {
                  const modalInstance = bootstrap.Modal.getInstance(commentsModalElement);
                  if (modalInstance) {
                      modalInstance.hide();
                  }

                  setTimeout(() => {
                      commentsModalElement.remove();
                      document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
                      resetBodyStyles();

                      loadCommentsCount(postId);

                      const currentPageSpan = document.querySelector('.comments-pagination span');
                      let currentPage = 0;

                      if (currentPageSpan) {
                          const match = currentPageSpan.textContent.match(/Страница (\d+) из/);
                          currentPage = match ? parseInt(match[1]) - 1 : 0;
                      }

                      openComments(postId, currentPage);
                  }, 150);
              }
          })
          .catch(error => {
              console.error('Ошибка:', error);
              showErrorAlert(error.message);
          });
      }

      async function updateCommentsModalContent(comments, pageData) {
          const commentsContainer = document.querySelector('.comments-container');
          const paginationContainer = document.querySelector('.comments-pagination');

          if (!commentsContainer) return;

          try {
              const currentUserId = await getCurrentUserId();
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

              commentsContainer.innerHTML = commentsHTML.join('') || '<p>Пока нет комментариев</p>';

              if (paginationContainer) {
                  paginationContainer.innerHTML = `
                      <button class="btn btn-outline-secondary ${pageData.number === 0 ? 'disabled' : ''}"
                              id="prevCommentsPage">← Назад</button>
                      <span class="mx-2">Страница ${pageData.number + 1} из ${pageData.totalPages}</span>
                      <button class="btn btn-outline-secondary ${pageData.number >= pageData.totalPages - 1 ? 'disabled' : ''}"
                              id="nextCommentsPage">Вперед →</button>
                  `;

                  document.getElementById('prevCommentsPage')?.addEventListener('click', () => {
                      if (pageData.number > 0) {
                          reloadComments(postId, pageData.number - 1);
                      }
                  });

                  document.getElementById('nextCommentsPage')?.addEventListener('click', () => {
                      if (pageData.number < pageData.totalPages - 1) {
                          reloadComments(postId, pageData.number + 1);
                      }
                  });
              }

              setupCommentLikeButtons();
              comments.forEach(comment => {
                  if (currentUserId) {
                      checkIfCommentLiked(comment.id);
                  }
                  loadCommentLikesCount(comment.id);
              });
              setupDeleteCommentsButtons();
              setupCommentsEditButtons();

          } catch (error) {
              console.error('Ошибка обновления содержимого:', error);
          }
      }

      function reloadComments(postId, page) {
          const token = localStorage.getItem('token');
          if (!token) return;

          fetch(`/api/v1/comments/${postId}/comments_of_post?page=${page}&size=${commentsPerPage}`, {
              method: 'GET',
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
              }
          })
          .then(response => {
              if (!response.ok) throw new Error('Ошибка загрузки комментариев');
              return response.json();
          })
          .then(data => {
              const comments = data._embedded?.commentDTOList || [];
              const pageData = data.page || { number: 0, totalPages: 1 };

              updateCommentsModalContent(comments, pageData);
          })
          .catch(error => {
              console.error('Ошибка обновления комментариев:', error);
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

          closeAllModals();

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
              const newButton = button.cloneNode(true);
              button.parentNode.replaceChild(newButton, button);
          });

          document.querySelectorAll('.edit-button').forEach(button => {
              button.addEventListener('click', function(e) {
                  e.stopPropagation();
                  e.preventDefault();

                  if (document.getElementById('editPostModal')?.classList.contains('show')) {
                      return;
                  }

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

          if (currentDeleteModal) {
              currentDeleteModal.hide();
              const oldModal = document.getElementById('deleteConfirmationModal');
              if (oldModal) oldModal.remove();
          }


          if (currentEditModal) {
              currentEditModal.hide();
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

            currentDeleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmationModal'));

            // Удаляем старый обработчик и добавляем новый
            const deleteButton = document.getElementById('confirmDeleteButton');
            const newDeleteButton = deleteButton.cloneNode(true);
            deleteButton.parentNode.replaceChild(newDeleteButton, deleteButton);

            newDeleteButton.addEventListener('click', function() {
                deletePost(postId);
                currentDeleteModal.hide();
            });

            currentDeleteModal.show();

            document.getElementById('deleteConfirmationModal').addEventListener('hidden.bs.modal', function() {
                if (this.parentNode) {
                    this.parentNode.removeChild(this);
                }
                currentDeleteModal = null;
            });
      }

      function deletePost(postId) {
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
              if(response.ok) {
                    showSuccessAlert('Пост удален');
                  window.location.href = "http://localhost:8080/welcome";
              } else if (response.status == 403) {
                  throw new Error('Недостаточно прав для удаления');
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
              const newButton = button.cloneNode(true);
              button.parentNode.replaceChild(newButton, button);
          });

          document.querySelectorAll('.delete-button').forEach(button => {
              button.addEventListener('click', function(e) {
                  e.stopPropagation();
                  e.preventDefault();

                  if (document.getElementById('deleteConfirmationModal')?.classList.contains('show')) {
                      return;
                  }

                  const postId = this.getAttribute('data-post-id');
                  showDeleteConfirmationModal(postId);
              });
          });
      }

      function showEditModal(post) {
          if (currentEditModal) {
              currentEditModal.hide();
              const oldModal = document.getElementById('editPostModal');
              if (oldModal) oldModal.remove();
          }

          if (currentDeleteModal) {
              currentDeleteModal.hide();
          }

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

          currentEditModal = new bootstrap.Modal(document.getElementById('editPostModal'));

          const saveButton = document.getElementById('saveEditButton');
          const newSaveButton = saveButton.cloneNode(true);
          saveButton.parentNode.replaceChild(newSaveButton, saveButton);

          newSaveButton.addEventListener('click', function() {
              saveEditedPost(post.id);
          });

          currentEditModal.show();

          document.getElementById('editPostModal').addEventListener('hidden.bs.modal', function() {
              if (this.parentNode) {
                  this.parentNode.removeChild(this);
              }
              currentEditModal = null;
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

          const title = document.getElementById('editPostTitle').value;
          const content = document.getElementById('editPostContent').value;

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
                  const modal = bootstrap.Modal.getInstance(document.getElementById('editPostModal'));
                  modal.hide();
                  loadSinglePost(postId);
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
              alert('Не удалось обновить пост');
          });
      }

    function getPostIdFromUrl() {
        // Если URL вида http://localhost:8080/post/1
        const pathParts = window.location.pathname.split('/');
        const postIdFromPath = pathParts[pathParts.length - 1];

        // Если URL вида http://localhost:8080/post?id=1
        const urlParams = new URLSearchParams(window.location.search);
        const postIdFromParam = urlParams.get('id');

        return postIdFromPath || postIdFromParam;
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


    loadSinglePost(postId);

   document.addEventListener('DOMContentLoaded', function() {
       const postId = getPostIdFromUrl();

       if (postId) {
           loadSinglePost(postId);
       } else {
           document.getElementById('loading').style.display = 'none';
           document.getElementById('error').style.display = 'block';
           document.getElementById('error').querySelector('p').textContent =
               'ID поста не указан в URL';
       }
   });
});
