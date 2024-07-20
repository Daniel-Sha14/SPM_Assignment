document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggle-btn');
    const submitBtn = document.getElementById('submit-btn');
    const formTitle = document.getElementById('form-title');
    const container = document.querySelector('.container');
    const authForm = document.getElementById('auth-form');
    const usernameField = document.getElementById('username');
    const emailField = document.getElementById('email');
    const passwordField = document.getElementById('password');
    const backBtn = document.getElementById('back-btn');
    let isLogin = true;
    // event listener for the toggle button to switch between login and signup forms
    toggleBtn.addEventListener('click', toggleForm);
    // Toggle the form state between login and signup
    function toggleForm() {
        isLogin = !isLogin;
        updateFormState();
    }
    // Update the form's appearance and requirements based on the current state
    function updateFormState() {
        if (isLogin) {
            formTitle.textContent = 'LOGIN';
            submitBtn.textContent = 'LOGIN';
            usernameField.style.display = 'none';
            usernameField.removeAttribute('required');
            emailField.setAttribute('required', '');
            document.querySelector('.toggle-text').innerHTML = "Don't have an account? <span id='toggle-btn'>Sign up</span>";
        } else {
            formTitle.textContent = 'SIGN UP';
            submitBtn.textContent = 'SIGN UP';
            usernameField.style.display = 'block';
            usernameField.setAttribute('required', '');
            document.querySelector('.toggle-text').innerHTML = "Already have an account? <span id='toggle-btn'>Login</span>";
        }
        document.querySelector('.toggle-text span').addEventListener('click', toggleForm);
    }
    // Handle form submission for login and signup
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(authForm);
        const data = {
            password: formData.get('password')
        };

        if (isLogin) {
            data.email = formData.get('email');
        } else {
            data.username = formData.get('username');
            data.email = formData.get('email');
        }

        const endpoint = isLogin ? '/login' : '/signup';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (result.status === 'success') {
                alert(isLogin ? 'Login successful' : 'Signup successful');
                localStorage.setItem('token', result.token);
                window.location.href = '../html/index.html';
            } else {
                alert(isLogin ? 'Login failed: ' : 'Signup failed: ' + result.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        }
    });

    backBtn.addEventListener('click', () => {
        window.location.href = '../html/index.html';
    });

    updateFormState(); 
});
