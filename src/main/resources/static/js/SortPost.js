function renderSortPagination(totalPages, currentPage, theme, descending) {
  const postsContainer = document.getElementById('postsContainer');
  postsContainer.innerHTML = '';

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

  if (!posts || posts.length === 0) {
    postsContainer.innerHTML = '<p>Посты не найдены</p>';
    document.getElementById('pagination').style.display = 'none';
    return;
  }

  const paginationContainer = document.getElementById('pagination');
  paginationContainer.innerHTML = '';

  for (let i = 0; i < totalPages; i++) {
    const button = document.createElement('button');
    button.textContent = i + 1;
    button.addEventListener('click', () => {

      applySorting(theme, descending, i);
    });

    if (i === currentPage) {
      button.classList.add('active');
    }

    paginationContainer.appendChild(button);
  }
  document.getElementById('pagination').style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', function() {

  const sortState = {
    currentPage: 0,
    currentTheme: '',
    currentSort: 'asc',
    isLoading: false
  };


  const sortModal = new bootstrap.Modal(document.getElementById('sortModal'));
  const themeSelect = document.getElementById('themeSelect');
  const sortButton = document.getElementById('sortButton');
  const applySortButton = document.getElementById('applySort');
  const resetSortButton = document.getElementById('resetSort');
  const sortPagination = document.getElementById('pagination');


  const availableThemes = ["Программирование", "Новости", "Экономика", "Видеоигры", "Дизайн", "Образование", "Технологии", "Наука", "Искусство", "Музыка", "Кино"];
  availableThemes.forEach(theme => {
    const option = document.createElement('option');
    option.value = theme;
    option.textContent = theme;
    themeSelect.appendChild(option);
  });


  sortButton.addEventListener('click', () => sortModal.show());

  applySortButton.addEventListener('click', () => {
    sortState.currentTheme = themeSelect.value;
    sortState.currentSort = document.querySelector('input[name="sortOrder"]:checked').value;
    sortState.currentPage = 0;
    fetchSortedPosts();
    sortModal.hide();
  });

  resetSortButton.addEventListener('click', () => {
    themeSelect.value = "";
    document.getElementById('sortAsc').checked = true;
    sortState.currentTheme = '';
    sortState.currentSort = 'asc';
    sortState.currentPage = 0;
    window.loadDefaultPosts();
    sortModal.hide();
  });

  function fetchSortedPosts() {
    if (sortState.isLoading) return;
    sortState.isLoading = true;

    const { currentPage, currentTheme, currentSort } = sortState;
    const size = 20;
    let url = `/api/v1/posts/sort?page=${currentPage}&size=${size}&dateAscOrDesc=${currentSort === 'desc'}`;

    if (currentTheme) {
      url += `&theme=${encodeURIComponent(currentTheme)}`;
    }

    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then(data => {
        const posts = data._embedded?.postDTOList || data.content || [];
        const totalPages = data.page?.totalPages || 1;

        window.renderPosts(posts);
        window.renderPagination(totalPages, sortState.currentPage);
      })
      .catch(error => {
        console.error('Ошибка:', error);
        alert('Ошибка загрузки: ' + error.message);
      })
      .finally(() => {
        sortState.isLoading = false;
      });
  }

  function renderSortPagination(totalPages) {
    sortPagination.innerHTML = '';

    if (sortState.currentPage > 0) {
      const prevBtn = createPaginationButton('←', () => {
        sortState.currentPage--;
        fetchSortedPosts();
      });
      sortPagination.appendChild(prevBtn);
    }

    const startPage = Math.max(0, sortState.currentPage - 2);
    const endPage = Math.min(totalPages - 1, sortState.currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = createPaginationButton(i + 1, () => {
        sortState.currentPage = i;
        fetchSortedPosts();
      }, i === sortState.currentPage);
      sortPagination.appendChild(pageBtn);
    }

    if (sortState.currentPage < totalPages - 1) {
      const nextBtn = createPaginationButton('→', () => {
        sortState.currentPage++;
        fetchSortedPosts();
      });
      sortPagination.appendChild(nextBtn);
    }
  }

  function createPaginationButton(text, onClick, isActive = false) {
    const button = document.createElement('button');
    button.textContent = text;
    button.addEventListener('click', onClick);
    if (isActive) button.classList.add('active');
    return button;
  }
});
