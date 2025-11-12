document.getElementById('registration-form').addEventListener('submit', function(event) {
  event.preventDefault();
  const formData = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    password: document.getElementById('password').value,
    dateOfBirth: document.getElementById('date_of_birth').value
  };

  document.cookie = "XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

  fetch('/api/v1/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',

    },
    body: JSON.stringify(formData)
  })
    .then(response => {
        if (response.ok) {
            window.location.href = "http://localhost:8080/welcome";
        } else {
            return response.json().then(errorData => {
                console.error('Ошибка при отправке данных: ', response.statusText, errorData);
                alert('Произошла ошибка: ' + (errorData.message || 'Попробуйте ещё раз.'));
            });
        }
    })

});