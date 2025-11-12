document.getElementById('chat-btn-create').addEventListener('click', async function() {
    const token = localStorage.getItem('token');
    if (!token) {
       showAuthModal();
       return;
   }
    try {
        const response = await fetch('/api/v1/chat/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });

        if (response.status === 403) {
            throw new Error('Только администраторы могут создавать чаты');
        }

        if (response.status === 500) {
            throw new Error('Только администраторы могут создавать чаты');
        }

        if (!response.ok) {
            throw new Error('Ошибка сервера');
        }

        const result = await response.json();
        alert('Чат успешно создан!');
        loadChats(currentChatsPage);
    } catch (error) {
        console.error('Ошибка:', error);
        alert(`Ошибка: ${error.message}`);
    }
});

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