document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('darkModeToggle');
    const icon = toggleBtn ? toggleBtn.querySelector('i') : null;
    const html = document.documentElement;

    // 1. Cek Local Storage saat load
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        html.setAttribute('data-theme', savedTheme);
        updateIcon(savedTheme);
    }

    // 2. Fungsi Ganti Icon
    function updateIcon(theme) {
        if (!icon) return;
        if (theme === 'dark') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun'); // Icon Matahari di mode gelap
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon'); // Icon Bulan di mode terang
        }
    }

    // 3. Event Listener Klik
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateIcon(newTheme);
        });
    }
});