document.getElementById('deleteProfileBtn').addEventListener('click', function(event) {
    event.preventDefault();

    if (!confirm('Вы уверены, что хотите удалить профиль? Это действие нельзя отменить.')) {
        return;
    }
    const token = localStorage.getItem('token');

    getCurrentUser(token)
            .then(user => {
                if (!user) {
                    throw new Error('Пользователь не найден');
                }
                deleteUser(user.id, token);
            })
            .then(() => {
                showSuccessAlert('Профиль успешно удалён');
                window.location.href ='http://localhost:8080/welcome'
            })
            .catch(error => {
                console.error('Ошибка:', error);
                showErrorAlert(error.message);
            });
    });
    function showErrorAlert(message) {
        alert(`Ошибка: ${message}`);
    }
    function showSuccessAlert(message) {
        alert(message);
    }
    function deleteUser(userId, token) {
        return fetch(`/api/v1/users/delete_user/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        })
        .then(response => {
            if (!response.ok) throw new Error('Ошибка при удалении профиля');
            if(response.ok) {
                localStorage.removeItem('token');
            }
            return response.json();
        });
}