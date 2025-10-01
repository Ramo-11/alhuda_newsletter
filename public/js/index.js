// Like button functionality on home page
document.addEventListener('DOMContentLoaded', () => {
    const likeButtons = document.querySelectorAll('.btn-like');

    likeButtons.forEach((button) => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const filename = button.getAttribute('data-filename');
            const likeCountElement = document.querySelector(
                `[data-like-count="${decodeURIComponent(filename)}"]`
            );

            // Disable button during request
            button.disabled = true;

            try {
                const response = await fetch(`/api/like/${filename}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                const data = await response.json();

                if (data.success) {
                    // Update like count
                    if (likeCountElement) {
                        likeCountElement.textContent = data.likes;
                    }

                    // Toggle button state
                    if (data.liked) {
                        button.classList.add('liked');
                        button.querySelector('.like-text').textContent = 'Unlike';
                    } else {
                        button.classList.remove('liked');
                        button.querySelector('.like-text').textContent = 'Like';
                    }
                }
            } catch (error) {
                console.error('Error toggling like:', error);
            } finally {
                button.disabled = false;
            }
        });
    });
});
