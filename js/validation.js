const Validate = {
  emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,

  required(value) {
    return value.trim() ? '' : 'This field is required.';
  },

  email(value) {
    if (!value.trim()) return 'Email address is required.';
    return this.emailPattern.test(value.trim()) ? '' : 'Enter a valid email, e.g. user@domain.com.';
  },

  passwordProblems(value) {
    const problems = [];
    if (value.length < 8) problems.push('at least 8 characters');
    if (!/[A-Z]/.test(value)) problems.push('one uppercase letter');
    if (!/[a-z]/.test(value)) problems.push('one lowercase letter');
    if (!/[0-9]/.test(value)) problems.push('one number');
    return problems;
  },

  password(value) {
    if (!value) return 'Password is required.';
    const problems = this.passwordProblems(value);
    return problems.length ? 'Password needs ' + problems.join(', ') + '.' : '';
  },

  confirm(value, original) {
    if (!value) return 'Please confirm your password.';
    return value === original ? '' : 'Passwords do not match.';
  },

  // +7 or 8, then 10 digits; spaces, dashes and brackets are allowed
  phone(value) {
    if (!value.trim()) return 'Phone number is required.';
    const digits = value.replace(/[\s()-]/g, '');
    return /^(\+7|8)\d{10}$/.test(digits) ? '' : 'Enter a phone like +7 701 234 56 78.';
  },

  showError(input, message) {
    const group = input.closest('.form-group-val') || input.parentElement;
    const errorEl = group.querySelector('.error-text');
    input.classList.add('is-invalid');
    input.classList.remove('is-valid');
    input.setAttribute('aria-invalid', 'true');
    if (errorEl) errorEl.textContent = message;
  },

  showSuccess(input) {
    const group = input.closest('.form-group-val') || input.parentElement;
    const errorEl = group.querySelector('.error-text');
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
    input.removeAttribute('aria-invalid');
    if (errorEl) errorEl.textContent = '';
  },

  check(input, message) {
    if (message) {
      this.showError(input, message);
      return false;
    }
    this.showSuccess(input);
    return true;
  },

  clear(form) {
    form.querySelectorAll('.is-invalid, .is-valid').forEach((el) => {
      el.classList.remove('is-invalid', 'is-valid');
      el.removeAttribute('aria-invalid');
    });
    form.querySelectorAll('.error-text').forEach((el) => { el.textContent = ''; });
  }
};
