// Navbar scroll effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile menu toggle
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close menu on link click
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Keyboard accessibility for hamburger
hamburger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        hamburger.click();
    }
});

// Carousel functionality
let currentSlide = 0;
const track = document.getElementById('carouselTrack');
const dots = document.querySelectorAll('.carousel-dot');
const totalSlides = 4;

function updateCarousel() {
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
}

function moveCarousel(direction) {
    currentSlide = (currentSlide + direction + totalSlides) % totalSlides;
    updateCarousel();
}

function goToSlide(index) {
    currentSlide = index;
    updateCarousel();
}

// Auto-advance carousel every 5 seconds
setInterval(() => {
    moveCarousel(1);
}, 5000);

// Touch/swipe support for carousel
let touchStartX = 0;
let touchEndX = 0;
const carousel = document.getElementById('clinicCarousel');

carousel.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
}, {
    passive: true
});

carousel.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, {
    passive: true
});

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            moveCarousel(1); // Swipe left -> next
        } else {
            moveCarousel(-1); // Swipe right -> prev
        }
    }
}

// PDF Slides Carousel functionality
let currentSlideNum = 0;
const slidesTrack = document.getElementById('slidesTrack');
const slidesDots = document.querySelectorAll('#slidesDots .carousel-dot');
const slideCounter = document.getElementById('slideCounter');
const totalSlidesNum = 15;

function updateSlides() {
    slidesTrack.style.transform = `translateX(-${currentSlideNum * 100}%)`;
    slidesDots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlideNum);
    });
    slideCounter.textContent = currentSlideNum + 1;
}

function moveSlides(direction) {
    currentSlideNum = (currentSlideNum + direction + totalSlidesNum) % totalSlidesNum;
    updateSlides();
}

function goToSlideNum(index) {
    currentSlideNum = index;
    updateSlides();
}

// Touch/swipe support for slides carousel
const slidesCarousel = document.getElementById('slidesCarousel');
let slidesTouchStartX = 0;

slidesCarousel.addEventListener('touchstart', (e) => {
    slidesTouchStartX = e.changedTouches[0].screenX;
}, {
    passive: true
});

slidesCarousel.addEventListener('touchend', (e) => {
    const slidesTouchEndX = e.changedTouches[0].screenX;
    const diff = slidesTouchStartX - slidesTouchEndX;
    const swipeThreshold = 50;

    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            moveSlides(1);
        } else {
            moveSlides(-1);
        }
    }
}, {
    passive: true
});

// Keyboard navigation for slides
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        moveSlides(-1);
    } else if (e.key === 'ArrowRight') {
        moveSlides(1);
    }
});

// --- MODAL (FELUGRÓ ABLAK) LOGIKA ---

// Elemek kiválasztása
const modal = document.getElementById("slidesModal");
const openBtns = document.querySelectorAll(".open-slides-btn");
const closeBtn = document.querySelector(".close-modal");

// 1. Megnyitás: Bármelyik gombra kattintunk, ami megkapta az 'open-slides-btn' classt
openBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        modal.classList.add("show");
        document.body.style.overflow = "hidden"; // Letiltja a háttér görgetését, amíg nyitva van
    });
});

// 2. Bezárás: Az "X" gombra kattintva
closeBtn.addEventListener("click", () => {
    modal.classList.remove("show");
    document.body.style.overflow = "auto"; // Visszaadja a háttér görgethetőségét
});

// 3. Bezárás: Ha a sötét háttérre (a tartalom mellé) kattintunk
window.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.classList.remove("show");
        document.body.style.overflow = "auto";
    }
});

// 4. Bezárás: Az "Escape" (ESC) billentyű megnyomásával
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("show")) {
        modal.classList.remove("show");
        document.body.style.overflow = "auto";
    }
});

function togglePillarInfo(element) {
    // Ha már nyitva van, bezárjuk
    if (element.classList.contains('active')) {
        element.classList.remove('active');
    } else {
        // Először bezárjuk az összes többit (opcionális)
        document.querySelectorAll('.pillar-card').forEach(card => {
            card.classList.remove('active');
        });
        // Megnyitjuk a kattintottat
        element.classList.add('active');
    }
}

function toggleIndication(element) {
    const isActive = element.classList.contains('active');

    // Minden más kártya bezárása
    document.querySelectorAll('.indication-card').forEach(card => {
        card.classList.remove('active');
    });

    // Ha nem volt nyitva, kinyitjuk
    if (!isActive) {
        element.classList.add('active');
    }
}
