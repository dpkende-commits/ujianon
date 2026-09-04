// ============================================================
// NAVBAR MODULE - Ujian Online System
// ============================================================

(function() {
    'use strict';

    // ============================================================
    // STATE
    // ============================================================
    let isNavbarOpen = false;
    let currentUser = null;

    // ============================================================
    // DOM REFS
    // ============================================================
    const navbar = {
        toggle: document.getElementById('navbarToggle'),
        menu: document.getElementById('navbarMenu'),
        dropdowns: document.querySelectorAll('.dropdown-menu'),
        dropdownToggles: document.querySelectorAll('.dropdown-toggle'),
        notif: document.getElementById('notifDropdown'),
        notifBadge: document.getElementById('notifBadge'),
        userDropdown: document.getElementById('userDropdown'),
        userArrow: document.querySelector('.user-arrow'),
        adminMenu: document.getElementById('adminMenu'),
        avatar: document.getElementById('userInitial'),
        userName: document.getElementById('userName'),
        userRole: document.getElementById('userRole'),
        dropdownAvatar: document.getElementById('dropdownUserInitial'),
        dropdownUserName: document.getElementById('dropdownUserName'),
        dropdownUserRole: document.getElementById('dropdownUserRole')
    };

    // ============================================================
    // TOGGLE NAVBAR (Mobile)
    // ============================================================
    function toggleNavbar() {
        isNavbarOpen = !isNavbarOpen;
        navbar.menu.classList.toggle('open');
        navbar.toggle.classList.toggle('active');

        // Close all dropdowns when closing navbar
        if (!isNavbarOpen) {
            closeAllDropdowns();
        }
    }

    /**
     * Close navbar (mobile)
     */
    function closeNavbar() {
        if (isNavbarOpen) {
            isNavbarOpen = false;
            navbar.menu.classList.remove('open');
            navbar.toggle.classList.remove('active');
        }
    }

    // ============================================================
    // DROPDOWN FUNCTIONS
    // ============================================================

    /**
     * Toggle dropdown menu
     * @param {string} dropdownId - ID dropdown yang akan di-toggle
     */
    function toggleDropdown(dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;

        const isOpen = dropdown.classList.contains('show');

        // Close all other dropdowns
        closeAllDropdowns();

        if (!isOpen) {
            dropdown.classList.add('show');
            const parent = dropdown.closest('.nav-item');
            const arrow = parent ? parent.querySelector('.dropdown-arrow') : null;
            if (arrow) arrow.classList.add('open');
        }
    }

    /**
     * Close all dropdown menus
     */
    function closeAllDropdowns() {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });
        document.querySelectorAll('.dropdown-arrow').forEach(arrow => {
            arrow.classList.remove('open');
        });

        // Close notification
        if (navbar.notif) {
            navbar.notif.classList.remove('show');
        }

        // Close user dropdown
        if (navbar.userDropdown) {
            navbar.userDropdown.classList.remove('show');
            if (navbar.userArrow) navbar.userArrow.classList.remove('open');
        }
    }

    // ============================================================
    // NOTIFICATION FUNCTIONS
    // ============================================================

    /**
     * Toggle notification dropdown
     */
    function toggleNotification() {
        if (!navbar.notif) return;

        const isOpen = navbar.notif.classList.contains('show');

        // Close user dropdown if open
        if (navbar.userDropdown && navbar.userDropdown.classList.contains('show')) {
            navbar.userDropdown.classList.remove('show');
            if (navbar.userArrow) navbar.userArrow.classList.remove('open');
        }

        if (isOpen) {
            navbar.notif.classList.remove('show');
        } else {
            navbar.notif.classList.add('show');
            // Update badge if needed
            updateNotificationBadge();
        }
    }

    /**
     * Update notification badge
     */
    function updateNotificationBadge() {
        // Simulasi update badge
        const count = Math.floor(Math.random() * 5);
        if (navbar.notifBadge) {
            navbar.notifBadge.textContent = count;
            navbar.notifBadge.style.display = count > 0 ? 'block' : 'none';
        }
    }

    // ============================================================
    // USER FUNCTIONS
    // ============================================================

    /**
     * Toggle user dropdown menu
     */
    function toggleUserMenu() {
        if (!navbar.userDropdown) return;

        const isOpen = navbar.userDropdown.classList.contains('show');

        // Close notification if open
        if (navbar.notif && navbar.notif.classList.contains('show')) {
            navbar.notif.classList.remove('show');
        }

        if (isOpen) {
            navbar.userDropdown.classList.remove('show');
            if (navbar.userArrow) navbar.userArrow.classList.remove('open');
        } else {
            navbar.userDropdown.classList.add('show');
            if (navbar.userArrow) navbar.userArrow.classList.add('open');
        }
    }

    /**
     * Update user info in navbar
     * @param {object} user - Data user dari session
     */
    function updateUserInfo(user) {
        if (!user) {
            // Jika tidak ada user, redirect ke login
            window.location.href = '../../public/login.html';
            return;
        }

        currentUser = user;
        const initial = user.name.charAt(0).toUpperCase();

        // Update avatar
        if (navbar.avatar) navbar.avatar.textContent = initial;
        if (navbar.dropdownAvatar) navbar.dropdownAvatar.textContent = initial;

        // Update name
        if (navbar.userName) navbar.userName.textContent = user.name;
        if (navbar.dropdownUserName) navbar.dropdownUserName.textContent = user.name;

        // Update role
        const roleText = user.role === 'admin' ? 'Admin' : 'Guru';
        if (navbar.userRole) navbar.userRole.textContent = roleText;
        if (navbar.dropdownUserRole) navbar.dropdownUserRole.textContent = roleText;

        // Show/hide admin menu
        if (navbar.adminMenu) {
            if (user.role === 'admin') {
                navbar.adminMenu.classList.add('show');
            } else {
                navbar.adminMenu.classList.remove('show');
            }
        }
    }

    /**
     * Handle logout
     */
    function handleLogout(event) {
        event.preventDefault();
        if (confirm('Apakah Anda yakin ingin logout?')) {
            // Clear session
            sessionStorage.removeItem('userSession');
            localStorage.removeItem('userSession');
            window.location.href = '../../public/login.html';
        }
    }

    /**
     * Set active nav link
     * @param {string} page - Nama halaman aktif
     */
    function setActiveNav(page) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        const activeLink = document.getElementById(`nav${page}`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    // ============================================================
    // SCROLL EFFECT
    // ============================================================

    function handleScroll() {
        const navbar = document.querySelector('.navbar');
        if (navbar && window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else if (navbar) {
            navbar.classList.remove('scrolled');
        }
    }

    // ============================================================
    // EVENT LISTENERS
    // ============================================================

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(event) {
        const target = event.target;

        // Check if click is inside any navbar component
        const isInsideNavbar = target.closest('.navbar');
        const isInsideDropdown = target.closest('.dropdown');
        const isInsideNotif = target.closest('.nav-notification');
        const isInsideUser = target.closest('.nav-user');

        if (!isInsideNavbar) {
            closeAllDropdowns();
            if (isNavbarOpen) {
                closeNavbar();
            }
            return;
        }

        // Close dropdowns if clicking outside dropdown area
        if (!isInsideDropdown && !isInsideNotif && !isInsideUser) {
            closeAllDropdowns();
        }

        // Close navbar menu on mobile when clicking a link
        if (target.closest('.nav-link') && !target.closest('.dropdown-toggle')) {
            if (window.innerWidth <= 992) {
                closeNavbar();
            }
        }
    });

    // Close dropdown on Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeAllDropdowns();
            if (isNavbarOpen) {
                closeNavbar();
            }
        }
    });

    // Close navbar on resize to desktop
    window.addEventListener('resize', function() {
        if (window.innerWidth > 992 && isNavbarOpen) {
            closeNavbar();
        }
    });

    // Scroll effect
    window.addEventListener('scroll', handleScroll);

    // ============================================================
    // INIT NAVBAR
    // ============================================================

    /**
     * Initialize navbar with session data
     */
    function initNavbar() {
        // Check session
        let session = sessionStorage.getItem('userSession');
        if (!session) session = localStorage.getItem('userSession');

        if (session) {
            const data = JSON.parse(session);
            updateUserInfo(data.user);
            console.log('✅ Navbar loaded - User:', data.user.name);

            // Set active nav based on current page
            const path = window.location.pathname;
            if (path.includes('admin')) {
                setActiveNav('Dashboard');
            } else if (path.includes('guru')) {
                setActiveNav('Dashboard');
            }
        } else {
            // No session, redirect to login (except on login page)
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = '../../public/login.html';
            }
        }

        // Update notification badge
        updateNotificationBadge();

        // Expose functions globally
        window.toggleNavbar = toggleNavbar;
        window.toggleDropdown = toggleDropdown;
        window.toggleNotification = toggleNotification;
        window.toggleUserMenu = toggleUserMenu;
        window.handleLogout = handleLogout;
        window.setActiveNav = setActiveNav;
        window.updateUserInfo = updateUserInfo;
        window.closeAllDropdowns = closeAllDropdowns;
        window.closeNavbar = closeNavbar;

        console.log('✅ Navbar initialized');
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNavbar);
    } else {
        initNavbar();
    }

})();