// ============================================================
// LOGIN SLIDER - Ujian Online System
// ============================================================

(function() {
    'use strict';

    // ============================================================
    // CONFIG
    // ============================================================
    const SLIDER_CONFIG = {
        autoplay: true,
        interval: 5000,
        pauseOnHover: true,
        transitionDuration: 700
    };

    // ============================================================
    // STATE
    // ============================================================
    let currentSlide = 0;
    let totalSlides = 0;
    let autoplayTimer = null;
    let isPaused = false;

    // ============================================================
    // DOM REFS
    // ============================================================
    const track = document.querySelector('.slider-track');
    const dots = document.querySelectorAll('.slider-dot');
    const prevBtn = document.querySelector('.slider-arrow-prev');
    const nextBtn = document.querySelector('.slider-arrow-next');
    const sliderContainer = document.querySelector('.slider-container');
    const progressBar = document.querySelector('.autoplay-progress');

    // ============================================================
    // SLIDER DATA
    // ============================================================
    const slides = [{
        title: 'Ujian Kompetensi Guru (UKG)',
        desc: 'Asesmen untuk mengukur kompetensi pedagogik dan profesional guru.',
        image: '../img/guru1.jpg'
    }, {
        title: 'Sertifikasi Guru Profesional',
        desc: 'Meningkatkan kualitas pendidikan melalui sertifikasi guru.',
        image: '../img/guru2.jpg'
    }, {
        title: 'Pengembangan Karir Guru',
        desc: 'Evaluasi dan pengembangan karir tenaga pendidik profesional.',
        image: '../img/guru3.jpg'
    }];

    // ============================================================
    // INIT SLIDER
    // ============================================================
    function initSlider() {
        totalSlides = slides.length;

        if (track) {
            track.innerHTML = '';
        }

        slides.forEach((slide, index) => {
            const slideEl = document.createElement('div');
            slideEl.className = 'slider-slide';
            slideEl.innerHTML = `
                <img src="${slide.image}" alt="${slide.title}" loading="${index === 0 ? 'eager' : 'lazy'}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22800%22 height=%22450%22%3E%3Crect fill=%22%231a1a2e%22 width=%22800%22 height=%22450%22/%3E%3Ctext x=%22400%22 y=%22225%22 text-anchor=%22middle%22 fill=%22%2394a3b8%22 font-size=%2220%22 font-family=%22Arial%22%3E📚 ${slide.title}%3C/text%3E%3C/svg%3E'">
                <div class="slide-overlay">
                    <div class="slide-title">${slide.title}</div>
                    <div class="slide-desc">${slide.desc}</div>
                </div>
            `;
            track.appendChild(slideEl);
        });

        updateDots();
        goToSlide(0);

        if (SLIDER_CONFIG.autoplay) {
            startAutoplay();
        }
    }

    // ============================================================
    // SLIDER FUNCTIONS
    // ============================================================

    function goToSlide(index) {
        if (index < 0) index = totalSlides - 1;
        if (index >= totalSlides) index = 0;

        currentSlide = index;

        if (track) {
            track.style.transform = `translateX(-${currentSlide * 100}%)`;
            track.style.transition = `transform ${SLIDER_CONFIG.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        }

        updateDots();
        resetAutoplayProgress();
    }

    function goToNext() {
        goToSlide(currentSlide + 1);
    }

    function goToPrev() {
        goToSlide(currentSlide - 1);
    }

    function goToSlideByDot(index) {
        if (index === currentSlide) return;
        goToSlide(index);
        resetAutoplay();
    }

    // ============================================================
    // UI UPDATES
    // ============================================================

    function updateDots() {
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
    }

    function resetAutoplayProgress() {
        if (progressBar) {
            progressBar.style.animation = 'none';
            void progressBar.offsetWidth;
            progressBar.style.animation = `autoplayProgress ${SLIDER_CONFIG.interval}ms linear infinite`;
        }
    }

    // ============================================================
    // AUTOPLAY
    // ============================================================

    function startAutoplay() {
        if (autoplayTimer) {
            clearInterval(autoplayTimer);
        }
        autoplayTimer = setInterval(goToNext, SLIDER_CONFIG.interval);
    }

    function stopAutoplay() {
        if (autoplayTimer) {
            clearInterval(autoplayTimer);
            autoplayTimer = null;
        }
    }

    function resetAutoplay() {
        if (SLIDER_CONFIG.autoplay) {
            stopAutoplay();
            startAutoplay();
        }
    }

    function pauseAutoplay() {
        if (isPaused) return;
        isPaused = true;
        stopAutoplay();
        if (progressBar) {
            progressBar.style.animationPlayState = 'paused';
        }
    }

    function resumeAutoplay() {
        if (!isPaused) return;
        isPaused = false;
        if (SLIDER_CONFIG.autoplay) {
            startAutoplay();
            if (progressBar) {
                progressBar.style.animationPlayState = 'running';
            }
        }
    }

    // ============================================================
    // EVENT LISTENERS
    // ============================================================

    if (nextBtn) {
        nextBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            goToNext();
            resetAutoplay();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            goToPrev();
            resetAutoplay();
        });
    }

    dots.forEach((dot, index) => {
        dot.addEventListener('click', function() {
            goToSlideByDot(index);
        });
    });

    if (SLIDER_CONFIG.pauseOnHover && sliderContainer) {
        sliderContainer.addEventListener('mouseenter', function() {
            pauseAutoplay();
        });

        sliderContainer.addEventListener('mouseleave', function() {
            resumeAutoplay();
        });
    }

    // Keyboard navigation
    document.addEventListener('keydown', function(event) {
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            goToNext();
            resetAutoplay();
        }

        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            goToPrev();
            resetAutoplay();
        }
    });

    // Touch support
    let touchStartX = 0;
    let touchEndX = 0;

    if (sliderContainer) {
        sliderContainer.addEventListener('touchstart', function(event) {
            touchStartX = event.changedTouches[0].screenX;
        }, { passive: true });

        sliderContainer.addEventListener('touchend', function(event) {
            touchEndX = event.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;

            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    goToNext();
                } else {
                    goToPrev();
                }
                resetAutoplay();
            }
        }, { passive: true });
    }

    // ============================================================
    // RESIZE HANDLER
    // ============================================================
    let resizeTimer;

    function handleResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            goToSlide(currentSlide);
        }, 200);
    }

    window.addEventListener('resize', handleResize);

    // ============================================================
    // INIT
    // ============================================================
    document.addEventListener('DOMContentLoaded', function() {
        initSlider();
        console.log('✅ Login slider initialized');
        console.log(`📸 Total slides: ${totalSlides}`);
        console.log(`⏱️ Autoplay interval: ${SLIDER_CONFIG.interval}ms`);
        console.log('⌨️ Use arrow keys or dots to navigate');
    });

    // ============================================================
    // CLEANUP
    // ============================================================
    window.addEventListener('beforeunload', function() {
        stopAutoplay();
    });

})();