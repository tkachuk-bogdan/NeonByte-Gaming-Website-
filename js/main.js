/* =========================================================
   Assignment #4: Introduction to JavaScript
   (updated in Assignment #5: theme-aware background colours,
   popup accessibility, registration form sent with fetch + callbacks)
   Team NeonByte: Bekzat Kuatbekov & Bogdan Tkachuk | Group: SE-2511
   Uses SoundFX, sendFormData and API_URL from js/app.js
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
  setInterval(updateDateTime, 1000); // update every second


  // ---------------------------------------------------------
  // Task 4: Dynamic Background Color Changer
  // Each theme has its own palette, so the text stays readable.
  // ---------------------------------------------------------
  const bgPalettes = {
    dark: ['#12101c', '#0f172a', '#1e1b4b', '#172554', '#1f1938'],
    light: ['#f4f2fb', '#eef6ff', '#f5f0ff', '#effcf9', '#fff7ed']
  };
  let colorIndex = 0;
  const bgBtn = document.getElementById('change-bg-btn');

  if (bgBtn) {
    bgBtn.addEventListener('click', () => {
      const theme = document.documentElement.getAttribute('data-bs-theme') === 'light' ? 'light' : 'dark';
      const colors = bgPalettes[theme];
      colorIndex = (colorIndex + 1) % colors.length;
      document.body.style.backgroundColor = colors[colorIndex];
    });
  }


  // ---------------------------------------------------------
  // Task 3: Popup Subscription Modal Window
  // (the subscribe form itself is handled in app.js)
  // ---------------------------------------------------------
  const modal = document.getElementById('popup-modal');
  const openModalBtn = document.getElementById('open-popup-btn');
  const closeModalBtn = document.getElementById('close-popup-btn');

  function openModal() {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    const emailInput = modal.querySelector('input[type="email"]');
    if (emailInput) setTimeout(() => emailInput.focus(), 100);
  }

  function closeModal() {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    openModalBtn.focus(); // give the focus back to the button that opened it
  }

  if (openModalBtn && modal) {
    openModalBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });

    closeModalBtn.addEventListener('click', closeModal);

    // Close when the dark area outside the window is clicked
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
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

      // Close the other open items
      document.querySelectorAll('.custom-accordion-item').forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
          otherItem.querySelector('.custom-accordion-body').style.maxHeight = null;
        }
      });

      // Toggle the clicked item
      item.classList.toggle('active');
      if (item.classList.contains('active')) {
        body.style.maxHeight = body.scrollHeight + 'px';
      } else {
        body.style.maxHeight = null;
      }
    });
  });


  // ---------------------------------------------------------
  // Task 1: Form Validation (contact.html)
  // A5: a valid form is sent with fetch (no page reload) and
  // the result is shown by a success or error callback.
  // ---------------------------------------------------------
  const contactForm = document.getElementById('js-validated-form');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault(); // stop the normal page reload

      let isValid = true;

      // Fields
      const name = document.getElementById('val-name');
      const email = document.getElementById('val-email');
      const password = document.getElementById('val-password');
      const confirmPassword = document.getElementById('val-confirm-password');
      const rules = document.getElementById('val-rules');

      // Regular expression for an email address
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      // 1. Name
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

      // 3. Password (at least 8 characters)
      if (!password.value) {
        showError(password, 'Password is required');
        isValid = false;
      } else if (password.value.length < 8) {
        showError(password, 'Password must be at least 8 characters long');
        isValid = false;
      } else {
        showSuccess(password);
      }

      // 4. Confirm password
      if (!confirmPassword.value) {
        showError(confirmPassword, 'Please confirm your password');
        isValid = false;
      } else if (confirmPassword.value !== password.value) {
        showError(confirmPassword, 'Passwords do not match');
        isValid = false;
      } else {
        showSuccess(confirmPassword);
      }

      // 5. Club rules
      if (!rules.checked) {
        showError(rules, 'You must agree to the club rules');
        isValid = false;
      } else {
        showSuccess(rules);
      }

      const messageBox = document.getElementById('form-success-msg');

      if (!isValid) {
        messageBox.classList.add('d-none');
        playAnimation(contactForm, 'nb-shake');
        SoundFX.play('error');
        return;
      }

      // Everything is valid: send it without reloading the page
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      // the password is checked here but never sent anywhere
      const registration = { gamerTag: name.value.trim(), email: email.value.trim() };

      sendFormData(API_URL, registration,
        // success callback
        (result) => {
          showMessage(messageBox, 'success',
            `Registration #${result.id} received! Welcome to the squad, ${registration.gamerTag}.`);
          contactForm.reset();
          document.querySelectorAll('.is-valid').forEach(el => el.classList.remove('is-valid'));
          SoundFX.play('success');
          enableSubmit(submitBtn);
        },
        // error callback
        () => {
          showMessage(messageBox, 'danger', 'Could not send your registration. Check your connection and try again.');
          SoundFX.play('error');
          enableSubmit(submitBtn);
        }
      );
    });
  }

  // Validation helpers
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

  function showMessage(box, type, text) {
    box.classList.remove('d-none', 'alert-success', 'alert-danger');
    box.classList.add('alert-' + type);
    box.textContent = text;
  }

  function enableSubmit(button) {
    button.disabled = false;
    button.textContent = 'Submit Registration';
  }

});
