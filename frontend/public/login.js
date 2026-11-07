const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const loginButton = document.getElementById("loginButton");

function showLoginMessage(message, type = "error") {
    loginMessage.textContent = message;
    loginMessage.className = `message ${type}`;
    loginMessage.hidden = false;
}

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginMessage.hidden = true;

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    loginButton.disabled = true;
    loginButton.textContent = "Logging in...";

    try {
        const response = await fetch("http://localhost:3000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showLoginMessage(data.message || "Login failed.");
            return;
        }

        sessionStorage.setItem("token", data.token);
        window.location.href = "dashboard.html";
    } catch (error) {
        console.error("Login request failed:", error);
        showLoginMessage("Could not contact the server. Check that the backend is running.");
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = "Login";
    }
});
