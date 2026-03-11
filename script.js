const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const authForm = document.getElementById('authForm');
const sendOtpBtn = document.getElementById('sendOtpBtn');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const otpInput = document.getElementById('otp');
const statusEl = document.getElementById('status');
const otpHint = document.getElementById('otpHint');
const otpTimer = document.getElementById('otpTimer');
const oauthDialog = document.getElementById('oauthDialog');
const oauthTitle = document.getElementById('oauthTitle');
const allowAccess = document.getElementById('allowAccess');
const denyAccess = document.getElementById('denyAccess');

let currentMode = 'login';
let generatedOtp = null;
let activeProvider = null;
let otpCountdown = null;
let secondsLeft = 0;

function setStatus(message, type = '') {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
}

function switchMode(mode) {
  currentMode = mode;
  loginTab.classList.toggle('active', mode === 'login');
  signupTab.classList.toggle('active', mode === 'signup');
  loginTab.setAttribute('aria-selected', String(mode === 'login'));
  signupTab.setAttribute('aria-selected', String(mode === 'signup'));
  setStatus(
    mode === 'signup'
      ? 'Create your account securely with Email + Phone OTP verification.'
      : 'Login with your verified Email + Phone OTP.',
    ''
  );
}

function validateContact() {
  return emailInput.checkValidity() && phoneInput.checkValidity();
}

function startTimer(durationSec = 120) {
  clearInterval(otpCountdown);
  secondsLeft = durationSec;
  otpTimer.classList.remove('hidden');

  const render = () => {
    const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
    const secs = String(secondsLeft % 60).padStart(2, '0');
    otpTimer.innerHTML = `Expires in <strong>${mins}:${secs}</strong>`;
  };

  render();
  otpCountdown = setInterval(() => {
    secondsLeft -= 1;
    render();
    if (secondsLeft <= 0) {
      clearInterval(otpCountdown);
      generatedOtp = null;
      setStatus('OTP expired. Please request a new one.', 'error');
    }
  }, 1000);
}

function sendOtp() {
  if (!validateContact()) {
    authForm.reportValidity();
    setStatus('Please enter a valid email and phone number first.', 'error');
    return;
  }

  generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
  otpHint.textContent = `OTP sent to ${phoneInput.value}. Demo OTP: ${generatedOtp}`;
  setStatus('OTP sent successfully. Please enter it to continue.', 'ok');
  startTimer();
}

function verifyOtp() {
  if (!generatedOtp) {
    setStatus('No OTP has been sent yet. Click Send OTP first.', 'error');
    return false;
  }

  if (otpInput.value.trim() !== generatedOtp) {
    setStatus('Incorrect OTP. Please check and try again.', 'error');
    return false;
  }

  clearInterval(otpCountdown);
  generatedOtp = null;
  otpTimer.classList.add('hidden');
  setStatus(
    currentMode === 'signup'
      ? 'Account created and verified successfully. Welcome to Studyhub!'
      : 'Login verified successfully. Welcome back to Studyhub!',
    'ok'
  );
  return true;
}

function openOAuth(provider) {
  activeProvider = provider;
  oauthTitle.textContent = `Continue with ${provider}`;
  oauthDialog.showModal();
}

loginTab.addEventListener('click', () => switchMode('login'));
signupTab.addEventListener('click', () => switchMode('signup'));
sendOtpBtn.addEventListener('click', sendOtp);

authForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!validateContact()) {
    authForm.reportValidity();
    setStatus('Please fill out valid details before verification.', 'error');
    return;
  }
  verifyOtp();
});

document.querySelectorAll('.social').forEach((btn) => {
  btn.addEventListener('click', () => openOAuth(btn.dataset.provider));
});

allowAccess.addEventListener('click', () => {
  const token = `token_${Math.random().toString(36).slice(2, 10)}`;
  setStatus(`${activeProvider} access granted. Login verified with token: ${token}`, 'ok');
  oauthDialog.close();
});

denyAccess.addEventListener('click', () => {
  setStatus(`${activeProvider} access denied. Please choose another login method.`, 'error');
  oauthDialog.close();
});

switchMode('login');
