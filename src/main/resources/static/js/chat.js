document.addEventListener('DOMContentLoaded', function() {

    const chatContainer = document.querySelector('.chat-container');
    const toggleBtn = document.querySelector('.btn-toggle-chat');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.querySelector('.btn-send');
    const chatMessages = document.getElementById('chatMessages');

    let isAdmin = false; // Флаг админа
    let currentUser = null; // Текущий пользователь

    // Проверка авторизации и прав
    function checkAuth() {
        const token = localStorage.getItem('token');
        if (!token) {
            showAuthModal();
            return false;
        }

        // Здесь можно добавить проверку на админа
        // Например, по userId или другим параметрам
        return true;
    }

    // Переключение состояния чата
    toggleBtn.addEventListener('click', function(e) {
           e.stopPropagation();
           chatContainer.classList.toggle('collapsed');

           const icon = toggleBtn.querySelector('i');
           if (chatContainer.classList.contains('collapsed')) {
               icon.classList.remove('bi-dash');
               icon.classList.add('bi-plus');
           } else {
               icon.classList.remove('bi-plus');
               icon.classList.add('bi-dash');
               loadMessages();
           }
       });

       sendBtn.addEventListener('click', sendMessage);
       chatInput.addEventListener('keypress', function(e) {
           if (e.key === 'Enter') sendMessage();
       });

    // Отправка сообщения
    async function sendMessage() {
        if (!checkAuth()) {
            showAuthModal();
            return;
        }

        const message = chatInput.value.trim();
        if (!message) return;

        try {
            const response = await fetch('/api/v1/message/send_message', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: message })
            });

            if (!response.ok) throw new Error('Ошибка отправки сообщения');

            chatInput.value = '';
            loadMessages();
        } catch (error) {
            console.error('Ошибка:', error);
            showErrorAlert(error.message);
        }
    }

    // Загрузка сообщений
    async function loadMessages() {
        try {
            const response = await fetch('/api/v1/message/all_messages', {
            });
            if (!response.ok) throw new Error('Ошибка при загрузке сообщений');

            const messages = await response.json();
            renderMessages(messages);
        } catch (error) {
            console.error('Ошибка:', error);
            showErrorAlert(error.message);
        }
    }

    async function renderMessages(messages) {
        chatMessages.innerHTML = '';

        if (!messages || messages.length === 0) {
            chatMessages.innerHTML = '<div class="no-messages">Нет сообщений</div>';
            return;
        }

        const currentUser = await getCurrentUser();

        for (const msg of messages) {

            const messageData = typeof msg === 'string' ? JSON.parse(msg) : msg;

            // Определяем автора сообщения
            const isMyMessage = currentUser && messageData.userId === currentUser.id;
            const authorName = isMyMessage ? 'Вы' : messageData.authorName || 'Аноним';

            await renderChatMessage({
                text: messageData.text,
                authorName: authorName,
                userId: messageData.userId,
                publicationDateTime: messageData.publicationDateTime || new Date().toISOString()
            }, isMyMessage);
        }
    }

  async function getCurrentUser() {
      const token = localStorage.getItem('token');
      if (!token) return null;

      try {
          const response = await fetch('/api/v1/users/me', {
              headers: {
                  'Authorization': `Bearer ${token}`
              }
          });

          if (!response.ok) return null;
          return await response.json();
      } catch (error) {
          console.error('Ошибка получения данных пользователя:', error);
          return null;
      }
  }



    async function addMessage(author, text, timestamp, userId, isMyMessage = false) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        if (isMyMessage) messageElement.classList.add('my-message');

        const timeString = timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const avatarSrc = await getAvatarUrl(userId);

        messageElement.innerHTML = `
            <div class="message-header">
                <img src="${avatarSrc}"
                     class="message-author-avatar"
                     alt="Аватар"
                     onerror="this.src='/images/R7iW4fmaKrA.png'">
                <div class="message-author">${author}</div>
            </div>
            <div class="message-text">${typeof text === 'object' ? text.text : text}</div>
            <div class="message-time">${timeString}</div>
        `;

        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function initChat() {
        const token = localStorage.getItem('token');
        if (token) {
            // Можно добавить получение информации о пользователе
            // и установку currentUser и isAdmin
        }
        loadMessages();
    }

    initChat();
    sendBtn.addEventListener('click', sendMessage);
});