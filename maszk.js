const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
});

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -60px 0px'
});
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        document.getElementById('pdfModal').style.display = 'none';
        document.getElementById('imageModal').style.display = 'none';
    }
    if (e.key === 'ArrowRight' && document.getElementById('pdfModal').style.display === 'flex') changeSlide(1);
    if (e.key === 'ArrowLeft' && document.getElementById('pdfModal').style.display === 'flex') changeSlide(-1);
});

let currentSlide = 1;
const totalSlides = document.querySelectorAll('.modal-slide').length;
const dotsEl = document.getElementById('slideDots');

for (let i = 1; i <= totalSlides; i++) {
    const dot = document.createElement('div');
    dot.style.cssText = 'width:8px;height:8px;border-radius:50%;cursor:pointer;transition:all 0.3s;';
    dot.dataset.slide = i;
    dot.onclick = () => goToSlide(i);
    dotsEl.appendChild(dot);
}
updateDots();

function changeSlide(dir) {
    let next = currentSlide + dir;
    if (next < 1) next = totalSlides;
    if (next > totalSlides) next = 1;
    goToSlide(next);
}

function goToSlide(n) {
    const active = document.querySelector('.modal-slide.active');
    if (active) active.classList.remove('active');
    const target = document.querySelector('.modal-slide[data-slide="' + n + '"]');
    if (target) target.classList.add('active');
    currentSlide = n;
    document.getElementById('slideCounter').textContent = n + ' / ' + totalSlides;
    updateDots();
}

function updateDots() {
    dotsEl.querySelectorAll('div').forEach(d => {
        d.style.background = parseInt(d.dataset.slide, 10) === currentSlide ? '#c9a96e' : '#3a3530';
    });
}

document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const href = a.getAttribute('href');
        if (href === '#') {
            e.preventDefault();
            return;
        }
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});