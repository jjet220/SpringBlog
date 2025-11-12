document.getElementById('postForm').onsubmit = function(event) {
  event.preventDefault();

  const token = localStorage.getItem('token');

  if (!token) {
    showAuthModal();
    return;
  }


  const title = document.getElementById('postTitle').value;
  const content = document.getElementById('postContent').value;
  const theme = document.getElementById('selectedTheme').value;

  console.log('Заголовок:', title);
  console.log('Текст:', content);

  const form = document.getElementById('postForm');
  form.reset();

  const modalElement = document.getElementById('postFormModal');
  const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
  modal.hide();

  const formData = {
    namePost: title,
    text: content,
    theme: theme || 'Без темы'
  };

  fetch('/api/v1/posts/publication_post', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify(formData)
  })
    .then(response => {
      if (response.ok) {
        window.location.href = "http://localhost:8080/welcome";
      } else if (response.status === 403) {
        localStorage.removeItem('token');
        showAuthModal();
      } else {
        return response.json().then(errorData => {
          console.error('Ошибка при отправке данных: ', response.statusText, errorData);
          alert('Произошла ошибка: ' + (errorData.message || 'Попробуйте ещё раз'));
        });
      }
    })
    .catch(error => {
      console.error('Ошибка: ', error);
      showAuthModal();
    });
};

function showAuthModal() {
  let modalElement = document.getElementById('authModal');

  if (modalElement) {
    modalElement.remove();
  }

  const authModal = `
    <div class="modal fade" id="authModal" tabindex="-1" aria-labelledby="authModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="authModalLabel">Требуется авторизация</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p>Чтобы опубликовать пост, войдите или зарегистрируйтесь.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="redirectToLogin()">Войти</button>
            <button type="button" class="btn btn-primary" onclick="redirectToRegister()">Зарегистрироваться</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', authModal);

  const modal = new bootstrap.Modal(document.getElementById('authModal'));
  modal.show();
}

function redirectToLogin() {
  window.location.href = "http://localhost:8080/authentication";
}

function redirectToRegister() {
  window.location.href = "http://localhost:8080/registration";
}

const availableThemes = [
  "Программирование",
  "Новости",
  "Экономика",
  "Видеоигры",
  "Дизайн",
  "Образование",
  "Технологии",
  "Наука",
  "Искусство",
  "Музыка",
  "Кино"
];

function initThemeSelection() {
  const themeList = document.getElementById('themeList');
  const themeDropdown = document.getElementById('themeDropdown');
  const selectedThemeInput = document.getElementById('selectedTheme');


  themeList.innerHTML = '';

  availableThemes.forEach(theme => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.className = 'dropdown-item';
    link.href = '#';
    link.textContent = theme;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      selectedThemeInput.value = theme;
      themeDropdown.textContent = theme;
    });
    li.appendChild(link);
    themeList.appendChild(li);
  });
}

document.getElementById('postFormModal').addEventListener('shown.bs.modal', function() {
  initThemeSelection();
});