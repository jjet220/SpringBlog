document.addEventListener('DOMContentLoaded', function () {
  const token = localStorage.getItem('token');

   if (!token) {
      hideLogoutButton();
      hideProfileLink();
      return;
   } else {
        hideLoginLink();
   }

  fetch('http://localhost:8080/api/v1/users/me', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
    .then(res => {
      if (!res.ok) {
        throw new Error('Ошибка при загрузке данных пользователя');
      }
      return res.json();
    })
    .then(user => {
      const profileLink = document.querySelector('.nav-link[href*="/profile/"]');
      if (profileLink) {
        profileLink.href = `http://localhost:8080/profile/${user.id}`;
         showProfileLink();
      }
      showLogoutButton();
      hideLoginLink();
    })
    .catch(err => {
      console.error('Ошибка:', err);
      hideLogoutButton();
      hideProfileLink();
      showLoginLink();
    });

  const logoutButton = document.querySelector('.nav-link[href*="/logout"]');
  if (logoutButton) {
    logoutButton.addEventListener('click', function (e) {
      e.preventDefault();
      logoutUser();
    });
  }
});

    function showProfileLink() {
      const profileLink = document.getElementById('profile-link');
      if (profileLink) {
        profileLink.style.display = 'block';
      }
    }

    function showLoginLink() {
        const loginLink = document.getElementById('login-link');
        if (loginLink) {
            loginLink.style.display = 'block'
        }
    }

    function hideLoginLink() {
        const loginLink = document.getElementById('login-link');
        if (loginLink) {
            loginLink.style.display = 'none';
        }
    }

    function hideProfileLink() {
      const profileLink = document.getElementById('profile-link');
      if (profileLink) {
        profileLink.style.display = 'none';
      }
    }


  function redirectToLogin() {
    window.location.href = "http://localhost:8080/authentication";
  }


  function redirectToRegister() {
    window.location.href = "http://localhost:8080/registration";
  }

  function showLogoutButton() {
    const logoutButton = document.querySelector('.nav-link[href*="/logout"]');
    if (logoutButton) {
      logoutButton.style.display = 'block';
    }
  }

  function hideLogoutButton() {
    const logoutButton = document.querySelector('.nav-link[href*="/logout"]');
    if (logoutButton) {
      logoutButton.style.display = 'none';
    }
  }

  function logoutUser() {
    localStorage.removeItem('token');
    window.location.href = 'http://localhost:8080/welcome';
  }