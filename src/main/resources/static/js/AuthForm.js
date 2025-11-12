document.getElementById("signing-form").addEventListener('submit', function (event) {
    event.preventDefault();

    document.getElementById('username-error').textContent = '';
    document.getElementById('password-error').textContent = '';
    document.getElementById('response-message').textContent = '';

    const password = document.getElementById('password').value;
    const username = document.getElementById('username').value;


    let isValid = true;

    if (username.length < 3 || username.length > 50) {
        document.getElementById('username-error').textContent = 'Имя пользователя должно содержать от 3 до 50 символов';
        isValid = false;
    }

    if (password.length < 8 || password.length > 255) {
        document.getElementById('password-error').textContent = 'Длина пароля должна быть от 8 до 255 символов';
        isValid = false;
    }

    if (!isValid) {
        return;
    }

    const formData = {
        password: password,
        name: username
    };

    fetch('api/v1/auth/signin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'

        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            return response.json().then(errorData => {
                throw new Error(errorData.message || 'Ошибка входа в систему');
            });
        }
    })
    .then(data => {
        document.getElementById('response-message').textContent = 'Вход выполнен успешно! Токен: ' + data.token;

        localStorage.setItem('token', data.token);

        window.location.href = '/welcome';
    })
    .catch(error => {
        document.getElementById('response-message').textContent = error.message;
    });
});