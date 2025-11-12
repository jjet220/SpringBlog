document.addEventListener('DOMContentLoaded', function() {
    const posts = document.querySelectorAll('.post');

    posts.forEach(post => {
        const content = post.querySelector('.post-content');
        post.addEventListener('click', () => {
            content.classList.toggle('expanded');
            post.classList.toggle('expended');
        });
    });
});