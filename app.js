const modeTabs = document.querySelectorAll('.tab');
const form = document.getElementById('auth-form');
const sendOtpBtn = document.getElementById('send-otp');
const verifyBtn = document.getElementById('verify-btn');
const otpHint = document.getElementById('otp-hint');
const status = document.getElementById('status');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const otpInput = document.getElementById('otp');

const socialButtons = document.querySelectorAll('.social');
const accessDialog = document.getElementById('access-dialog');
const accessTitle = document.getElementById('access-title');
const accessDescription = document.getElementById('access-description');
const accessForm = document.getElementById('access-form');
const cancelAccessBtn = document.getElementById('cancel-access');

let authMode = 'login';
let selectedProvider = null;

const setStatus = (text, type = '') => {
  status.textContent = text;
  status.className = `status ${type}`.trim();
};

const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(email);
const isValidPhone = (phone) => /^[+\d][\d\s-]{7,}$/.test(phone.trim());

modeTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    authMode = tab.dataset.mode;
    modeTabs.forEach((t) => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });

    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');

    verifyBtn.textContent = authMode === 'login' ? 'Verify & Continue' : 'Verify & Create Account';
    setStatus(`Switched to ${authMode === 'login' ? 'Login' : 'Create Account'} mode.`);
  });
});

sendOtpBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const phone = phoneInput.value.trim();

  if (!isValidEmail(email) || !isValidPhone(phone)) {
    setStatus('Enter a valid email and phone number before requesting OTP.', 'error');
    return;
  }

  sendOtpBtn.disabled = true;
  setStatus('Sending OTP to your Gmail…');
  otpHint.textContent = '';

  try {
    const response = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, phone }),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message || 'Unable to send OTP.');
    }

    otpHint.textContent = 'OTP has been emailed. Please check your inbox/spam folder.';
    setStatus(payload.message, 'success');
  } catch (error) {
    setStatus(error.message, 'error');
  } finally {
    sendOtpBtn.disabled = false;
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();
  const phone = phoneInput.value.trim();
  const otp = otpInput.value.trim();

  if (!otp) {
    setStatus('Please enter the OTP sent to your Gmail.', 'error');
    return;
  }

  verifyBtn.disabled = true;
  setStatus('Verifying OTP…');

  try {
    const response = await fetch('/api/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, phone, otp, mode: authMode }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.message || 'OTP verification failed.');
    }

    setStatus(payload.message, 'success');
    otpInput.value = '';
    otpHint.textContent = '';
  } catch (error) {
    setStatus(error.message, 'error');
  } finally {
    verifyBtn.disabled = false;
  }
});

socialButtons.forEach((button) => {
  button.addEventListener('click', () => {
    selectedProvider = button.dataset.provider;
    accessTitle.textContent = `${selectedProvider} Sign-In`;
    accessDescription.textContent = `Authorize ${selectedProvider} access to continue securely in Studyhub.`;
    accessDialog.showModal();
  });
});

cancelAccessBtn.addEventListener('click', () => {
  accessDialog.close('cancel');
});

accessForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const scopes = Array.from(new FormData(accessForm).getAll('scope'));
  accessDialog.close('granted');

  if (!selectedProvider || scopes.length === 0) {
    setStatus('Select at least one permission to continue with social login.', 'error');
    return;
  }

  setStatus(
    `${selectedProvider} login verified with ${scopes.join(', ')} access. Welcome to Studyhub!`,
    'success',
  );
});
