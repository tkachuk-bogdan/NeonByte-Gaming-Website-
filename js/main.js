/* =========================================================
   Assignment #4: Introduction to JavaScript
   Team: Bekzat Kuatbekov & Bogdan Tkachuk | Group: SE-2511
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  // ---------------------------------------------------------
  // Task 5: Display Current Date & Time
  // ---------------------------------------------------------
  function updateDateTime() {
    const dateTimeEl = document.getElementById('current-date-time');
    if (!dateTimeEl) return;

    const now = new Date();
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    dateTimeEl.textContent = now.toLocaleDateString('en-US', options);
  }
  updateDateTime();
  setInterval(updateDateTime, 1000); // Обновляем каждую секунду


  // ---------------------------------------------------------
  // Task 4: Dynamic Background Color Changer
  // ---------------------------------------------------------
  const bgColors = ['#12101c', '#0f172a', '#1e1b4b', '#172554', '#1f1938'];
  let colorIndex = 0;
  const bgBtn = document.getElementById('change-bg-btn');

  if (bgBtn) {
    bgBtn.addEventListener('click', () => {
      colorIndex = (colorIndex + 1) % bgColors.length;
      document.body.style.backgroundColor = bgColors[colorIndex];
    });
  }


  // ---------------------------------------------------------
  // Task 3: Popup Subscription Modal Window
  // ---------------------------------------------------------
  const modal = document.getElementById('popup-modal');
  const openModalBtn = document.getElementById('open-popup-btn');
  const closeModalBtn = document.getElementById('close-popup-btn');

  if (openModalBtn && modal) {
    openModalBtn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('active');
    });

    closeModalBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });

    // Закрытие при клике вне окна
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  }


  // ---------------------------------------------------------
  // Task 2: Accordion for FAQs
  // ---------------------------------------------------------
  const accordionHeaders = document.querySelectorAll('.custom-accordion-header');

  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const body = header.nextElementSibling;

      // Закрываем другие аккордеоны (по желанию)
      document.querySelectorAll('.custom-accordion-item').forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
          otherItem.querySelector('.custom-accordion-body').style.maxHeight = null;
        }
      });

      // Переключаем текущий
      item.classList.toggle('active');
      if (item.classList.contains('active')) {
        body.style.maxHeight = body.scrollHeight + 'px';
      } else {
        body.style.maxHeight = null;
      }
    });
  });


  // ---------------------------------------------------------
  // Task 1: Form Validation (на странице contact.html)
  // ---------------------------------------------------------
  const contactForm = document.getElementById('js-validated-form');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault(); // Предотвращаем стандартную отправку

      let isValid = true;

      // Поля
      const name = document.getElementById('val-name');
      const email = document.getElementById('val-email');
      const password = document.getElementById('val-password');
      const confirmPassword = document.getElementById('val-confirm-password');
      const rules = document.getElementById('val-rules');

      // Регулярное выражение для Email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      // 1. Имя
      if (!name.value.trim()) {
        showError(name, 'Name or Gamer Tag is required');
        isValid = false;
      } else {
        showSuccess(name);
      }

      // 2. Email
      if (!email.value.trim()) {
        showError(email, 'Email address is required');
        isValid = false;
      } else if (!emailRegex.test(email.value.trim())) {
        showError(email, 'Please enter a valid email (e.g. user@domain.com)');
        isValid = false;
      } else {
        showSuccess(email);
      }

      // 3. Пароль (не менее 8 символов)
      if (!password.value) {
        showError(password, 'Password is required');
        isValid = false;
      } else if (password.value.length < 8) {
        showError(password, 'Password must be at least 8 characters long');
        isValid = false;
      } else {
        showSuccess(password);
      }

      // 4. Подтверждение пароля
      if (!confirmPassword.value) {
        showError(confirmPassword, 'Please confirm your password');
        isValid = false;
      } else if (confirmPassword.value !== password.value) {
        showError(confirmPassword, 'Passwords do not match');
        isValid = false;
      } else {
        showSuccess(confirmPassword);
      }

      // 5. Правила
      if (!rules.checked) {
        showError(rules, 'You must agree to the club rules');
        isValid = false;
      } else {
        showSuccess(rules);
      }

      // Если все валидно
      if (isValid) {
        const successBox = document.getElementById('form-success-msg');
        successBox.classList.remove('d-none');
        contactForm.reset();
        // Очищаем классы через 4 секунды
        setTimeout(() => {
          successBox.classList.add('d-none');
          document.querySelectorAll('.is-valid').forEach(el => el.classList.remove('is-valid'));
        }, 4000);
      }
    });
  }

  // Вспомогательные функции валидации
  function showError(input, message) {
    const parent = input.closest('.form-group-val') || input.parentElement;
    const errorEl = parent.querySelector('.error-text');
    input.classList.add('is-invalid');
    input.classList.remove('is-valid');
    if (errorEl) errorEl.textContent = message;
  }

  function showSuccess(input) {
    const parent = input.closest('.form-group-val') || input.parentElement;
    const errorEl = parent.querySelector('.error-text');
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
    if (errorEl) errorEl.textContent = '';
  }

});