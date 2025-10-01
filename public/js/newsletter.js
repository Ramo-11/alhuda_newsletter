// Like button functionality
document.addEventListener('DOMContentLoaded', () => {
    const likeButton = document.getElementById('like-button');
    const likeCount = document.getElementById('like-count');

    if (likeButton) {
        likeButton.addEventListener('click', async () => {
            const filename = likeButton.getAttribute('data-filename');

            // Disable button during request
            likeButton.disabled = true;

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
                    likeCount.textContent = data.likes;

                    // Toggle button state
                    if (data.liked) {
                        likeButton.classList.add('liked');
                        likeButton.querySelector('.like-text').textContent = 'Unlike';
                    } else {
                        likeButton.classList.remove('liked');
                        likeButton.querySelector('.like-text').textContent = 'Like this Newsletter';
                    }
                }
            } catch (error) {
                console.error('Error toggling like:', error);
            } finally {
                likeButton.disabled = false;
            }
        });
    }

    // Auto-hide success message after 5 seconds
    const successAlert = document.querySelector('.success-alert');
    if (successAlert) {
        setTimeout(() => {
            successAlert.style.opacity = '0';
            successAlert.style.transition = 'opacity 0.5s ease';
            setTimeout(() => successAlert.remove(), 500);
        }, 5000);
    }

    if (window.innerWidth <= 1024) {
        const pdfWrapper = document.querySelector('.pdf-wrapper');
        if (pdfWrapper) {
            setTimeout(() => {
                pdfWrapper.classList.add('message-hidden');
            }, 10000);
        }
    }
});
