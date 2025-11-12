function loadPosts(page) {
    fetch(`/api/v1/posts/${userId}/user_posts?page=${page}&size=${postsPerPage}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Ошибка при загрузке постов');
        }
        return response.json();
      })
      .then(data => {
        if (data._embedded && data._embedded.postList) {
          renderPosts(data._embedded.postList);
          renderPagination(data.page.totalPages, page);
        } else {
          console.warn('Посты отсутствуют');
          renderPosts([]);
          renderPagination(data.page.totalPages, page);
        }
      })
      .catch(error => {
        console.error('Ошибка при загрузке постов:', error);
        alert('Произошла ошибка при загрузке постов');
      });
  }