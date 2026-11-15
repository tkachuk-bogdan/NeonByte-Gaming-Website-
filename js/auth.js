const Auth = {
  usersKey: 'nb-users',
  sessionKey: 'nb-session',

  getUsers() {
    try {
      return JSON.parse(loadSetting(this.usersKey, '[]')) || [];
    } catch (error) {
      return [];
    }
  },

  saveUsers(users) {
    saveSetting(this.usersKey, JSON.stringify(users));
  },

  findUser(email) {
    const wanted = email.trim().toLowerCase();
    return this.getUsers().find((user) => user.email === wanted);
  },

  currentUser() {
    const email = loadSetting(this.sessionKey, '');
    return email ? this.findUser(email) : undefined;
  },

  logIn(email) {
    saveSetting(this.sessionKey, email.trim().toLowerCase());
  },

  logOut() {
    try {
      localStorage.removeItem(this.sessionKey);
    } catch (error) {
    }
  },

  // only the sha-256 hash of the password is stored
  async hash(password) {
    if (window.crypto && crypto.subtle) {
      const bytes = new TextEncoder().encode(password);
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    return 'plain:' + password;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const user = Auth.currentUser();
  const page = document.body.dataset.page;

  const navAccount = document.getElementById('nav-account');
  if (navAccount && user) {
    navAccount.href = 'profile.html';
    navAccount.querySelector('.nb-account-label').textContent = user.name.split(' ')[0];
    navAccount.setAttribute('aria-label', 'Your profile');
  }

  if ((page === 'login' || page === 'signup') && user) {
    window.location.replace('profile.html');
    return;
  }
  if (page === 'profile' && !user) {
    window.location.replace('login.html?from=profile');
    return;
  }

  document.querySelectorAll('[data-toggle-password]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.togglePassword);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      button.textContent = show ? 'Hide' : 'Show';
      button.setAttribute('aria-pressed', String(show));
    });
  });

  if (page === 'signup') initSignUp();
  if (page === 'login') initLogIn();
  if (page === 'profile') initProfile(user);
});

function initSignUp() {
  const form = document.getElementById('signup-form');
  const fields = {
    name: document.getElementById('su-name'),
    email: document.getElementById('su-email'),
    phone: document.getElementById('su-phone'),
    password: document.getElementById('su-password'),
    confirm: document.getElementById('su-confirm'),
    terms: document.getElementById('su-terms')
  };
  const rules = document.querySelectorAll('#password-rules [data-rule]');

  fields.password.addEventListener('input', () => {
    const problems = Validate.passwordProblems(fields.password.value);
    rules.forEach((rule) => {
      const ok = !problems.includes(rule.dataset.rule);
      rule.classList.toggle('is-met', ok);
      rule.querySelector('.nb-rule-icon').textContent = ok ? '✓' : '•';
    });
  });

  const checks = {
    name: () => {
      const value = fields.name.value.trim();
      return Validate.check(fields.name, !value ? 'Name is required.' : value.length < 2 ? 'Name must be at least 2 characters.' : '');
    },
    email: () => {
      let message = Validate.email(fields.email.value);
      if (!message && Auth.findUser(fields.email.value)) message = 'An account with this email already exists. Log in instead.';
      return Validate.check(fields.email, message);
    },
    phone: () => Validate.check(fields.phone, Validate.phone(fields.phone.value)),
    password: () => Validate.check(fields.password, Validate.password(fields.password.value)),
    confirm: () => Validate.check(fields.confirm, Validate.confirm(fields.confirm.value, fields.password.value)),
    terms: () => Validate.check(fields.terms, fields.terms.checked ? '' : 'You must accept the club rules.')
  };

  Object.keys(checks).forEach((key) => {
    fields[key].addEventListener('blur', () => {
      if (fields[key].value || fields[key].classList.contains('is-invalid')) checks[key]();
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const results = Object.keys(checks).map((key) => checks[key]());

    if (results.includes(false)) {
      playAnimation(form, 'nb-shake');
      SoundFX.play('error');
      form.querySelector('.is-invalid').focus();
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    showButtonSpinner(submitButton);

    const users = Auth.getUsers();
    users.push({
      name: fields.name.value.trim(),
      email: fields.email.value.trim().toLowerCase(),
      phone: fields.phone.value.trim(),
      passwordHash: await Auth.hash(fields.password.value),
      createdAt: new Date().toISOString()
    });
    Auth.saveUsers(users);

    showToast('Account created! Please log in.');
    SoundFX.play('success');
    setTimeout(() => {
      window.location.href = 'login.html?registered=1&email=' + encodeURIComponent(fields.email.value.trim());
    }, 900);
  });
}

function initLogIn() {
  const form = document.getElementById('login-form');
  const email = document.getElementById('li-email');
  const password = document.getElementById('li-password');
  const alertBox = document.getElementById('login-alert');
  const params = new URLSearchParams(window.location.search);

  function showAlert(type, text) {
    alertBox.className = 'alert alert-' + type + ' mb-4';
    alertBox.textContent = text;
  }

  if (params.get('registered')) showAlert('success', 'Your account is ready. Log in with your new email and password.');
  if (params.get('from') === 'profile') showAlert('info', 'Please log in to see your profile.');
  if (params.get('loggedout')) showAlert('info', 'You have been logged out. See you next match!');
  if (params.get('email')) email.value = params.get('email');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const emailOk = Validate.check(email, Validate.email(email.value));
    const passwordOk = Validate.check(password, Validate.password(password.value));

    if (!emailOk || !passwordOk) {
      playAnimation(form, 'nb-shake');
      SoundFX.play('error');
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    showButtonSpinner(submitButton);

    const user = Auth.findUser(email.value);
    const hash = await Auth.hash(password.value);

    if (!user || user.passwordHash !== hash) {
      hideButtonSpinner(submitButton);
      Validate.showError(password, '');
      showAlert('danger', 'Wrong email or password. Check them and try again, or create an account.');
      playAnimation(form, 'nb-shake');
      SoundFX.play('error');
      password.value = '';
      password.focus();
      return;
    }

    Auth.logIn(user.email);
    showToast('Welcome back, ' + user.name.split(' ')[0] + '!');
    SoundFX.play('success');
    setTimeout(() => { window.location.href = 'profile.html'; }, 700);
  });
}

function initProfile(user) {
  const joined = new Date(user.createdAt);
  const initials = user.name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('');

  document.getElementById('profile-initials').textContent = initials;
  document.getElementById('profile-name').textContent = user.name;
  document.getElementById('profile-email').textContent = user.email;
  document.getElementById('profile-phone').textContent = user.phone;
  document.getElementById('profile-since').textContent = joined.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const rating = Number(loadSetting('nb-rating', '0'));
  document.getElementById('profile-rating').textContent = rating ? '★'.repeat(rating) + ' (' + rating + '/5)' : 'Not rated yet';
  document.getElementById('profile-theme').textContent = loadSetting('nb-theme', 'dark') === 'light' ? 'Day' : 'Night';
  document.getElementById('profile-deals').textContent = loadSetting('nb-deals-query', '') || 'No searches yet';

  document.getElementById('logout-btn').addEventListener('click', () => {
    Auth.logOut();
    SoundFX.play('click');
    window.location.href = 'login.html?loggedout=1';
  });
}
