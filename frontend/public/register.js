const registerForm = document.getElementById("registerForm");
const registerMessage = document.getElementById("registerMessage");
const registerButton = document.getElementById("registerButton");

function showRegisterMessage(message, type = "error") {
    registerMessage.textContent = message;
    registerMessage.className = `message ${type}`;
    registerMessage.hidden = false;
}

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    registerMessage.hidden = true;

    const formData = {
        username: document.getElementById("username").value.trim(),
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value,
        phone: document.getElementById("phone").value.trim(),
        dob: document.getElementById("dob").value
    };

    registerButton.disabled = true;
    registerButton.textContent = "Creating account...";

    try {
        const response = await fetch("http://localhost:3000/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });
        const data = await response.json();

        if (!response.ok) {
            showRegisterMessage(data.message || "Registration failed.");
            return;
        }

        showRegisterMessage(data.message + " Redirecting to login...", "success");
        registerForm.reset();
        setTimeout(() => window.location.href = "index.html", 1400);
    } catch (error) {
        console.error("Registration request failed:", error);
        showRegisterMessage("Could not contact the server. Check that the backend is running.");
    } finally {
        registerButton.disabled = false;
        registerButton.textContent = "Create Account";
    }
});
