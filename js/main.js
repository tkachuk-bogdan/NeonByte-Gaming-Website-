document.addEventListener('DOMContentLoaded', () => {

  // date and time
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
  setInterval(updateDateTime, 1000);

  // background colour changer
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

  // newsletter popup open / close
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
    openModalBtn.focus();
  }

  if (openModalBtn && modal) {
    openModalBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });

    closeModalBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  // faq accordion
  const accordionHeaders = document.querySelectorAll('.custom-accordion-header');

  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const body = header.nextElementSibling;

      document.querySelectorAll('.custom-accordion-item').forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
          otherItem.querySelector('.custom-accordion-body').style.maxHeight = null;
        }
      });

      item.classList.toggle('active');
      if (item.classList.contains('active')) {
        body.style.maxHeight = body.scrollHeight + 'px';
      } else {
        body.style.maxHeight = null;
      }
    });
  });

  // registration form validation
  const contactForm = document.getElementById('js-validated-form');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      let isValid = true;

      const name = document.getElementById('val-name');
      const email = document.getElementById('val-email');
      const phone = document.getElementById('val-phone');
      const password = document.getElementById('val-password');
      const confirmPassword = document.getElementById('val-confirm-password');
      const rules = document.getElementById('val-rules');

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!name.value.trim()) {
        showError(name, 'Name or Gamer Tag is required');
        isValid = false;
      } else {
        showSuccess(name);
      }

      if (!email.value.trim()) {
        showError(email, 'Email address is required');
        isValid = false;
      } else if (!emailRegex.test(email.value.trim())) {
        showError(email, 'Please enter a valid email (e.g. user@domain.com)');
        isValid = false;
      } else {
        showSuccess(email);
      }

      if (!Validate.check(phone, Validate.phone(phone.value))) isValid = false;

      if (!Validate.check(password, Validate.password(password.value))) isValid = false;

      if (!confirmPassword.value) {
        showError(confirmPassword, 'Please confirm your password');
        isValid = false;
      } else if (confirmPassword.value !== password.value) {
        showError(confirmPassword, 'Passwords do not match');
        isValid = false;
      } else {
        showSuccess(confirmPassword);
      }

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

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      showButtonSpinner(submitBtn);

      // the password is checked here but never sent anywhere
      const registration = {
        gamerTag: name.value.trim(),
        email: email.value.trim(),
        phone: phone.value.trim(),
        game: document.getElementById('val-game').value,
        playStyle: contactForm.querySelector('input[name="play-style"]:checked').value,
        message: document.getElementById('val-message').value.trim()
      };

      // short delay simulates a server call
      setTimeout(() => {
        sendFormData(API_URL, registration,
          (result) => {
            contactForm.reset();
            showMessage(messageBox, 'success',
              `Registration #${result.id} received! Welcome to the squad, ${registration.gamerTag}.`);
            showToast('Form submitted successfully!');
            SoundFX.play('success');
            enableSubmit(submitBtn);
          },
          () => {
            showMessage(messageBox, 'danger', 'Could not send your registration. Check your connection and try again.');
            showToast('Registration was not sent.', 'error');
            SoundFX.play('error');
            enableSubmit(submitBtn);
          }
        );
      }, 1500);
    });
  }

  if (contactForm) {
    contactForm.addEventListener('reset', () => {
      contactForm.querySelectorAll('.is-invalid, .is-valid').forEach(el => el.classList.remove('is-invalid', 'is-valid'));
      contactForm.querySelectorAll('.error-text').forEach(el => { el.textContent = ''; });
      document.getElementById('form-success-msg').classList.add('d-none');
    });
  }

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
    hideButtonSpinner(button);
  }

});
