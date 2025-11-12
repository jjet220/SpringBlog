const token = localStorage.getItem('token');

fetch('/api/v1/auth/protected', {
    method: 'GET',
    headers: {
        'Authorization': 'Bearer ' + token,
    },
})
.then(response => {
    if (response.ok) {
        return response.json();
    } else {
        throw new Error('Ошибка при запросе к защищенному API');
    }
})
.then(data => {
    console.log('Данные от защищённого API: ', data);
})
.catch(err => {
    console.error('Ошибка: ', err);
});
/*
fetch('/api/v1/protected', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
  .then(response => response.json())
  .then(data => {
    console.log('Данные от защищённого API:', data);
  })
  .catch(error => {
    console.error('Ошибка при запросе к защищённому API:', error);
  }); ДЛЯ ДОСТУПА К ЗАЩИЩЁННЫМ СТАРНИЦАМ*/
