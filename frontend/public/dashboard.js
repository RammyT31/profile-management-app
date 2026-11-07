const profileForm = document.getElementById("profileForm");
const profileMessage = document.getElementById("profileMessage");
const saveButton = document.getElementById("saveButton");
const logoutButton = document.getElementById("logoutButton");
const token = sessionStorage.getItem("token");

function showProfileMessage(message, type = "error") {
    profileMessage.textContent = message;
    profileMessage.className = `message ${type}`;
    profileMessage.hidden = false;
}

function logOut() {
    sessionStorage.removeItem("token");
    window.location.href = "index.html";
}

logoutButton.addEventListener("click", logOut);

if (!token) {
    logOut();
} else {
    loadProfile();
}

async function loadProfile() {
    try {
        const response = await fetch("/api/profile", {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();

        if (response.status === 401) return logOut();
        if (!response.ok) throw new Error(data.message || "Unable to load profile.");

        document.getElementById("username").value = data.profile.username;
        document.getElementById("email").value = data.profile.email;
        document.getElementById("phone").value = data.profile.phone;
        document.getElementById("dob").value = data.profile.dob;
    } catch (error) {
        showProfileMessage(error.message || "Unable to load your profile.");
    }
}

profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    profileMessage.hidden = true;

    const updatedProfile = {
        username: document.getElementById("username").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        dob: document.getElementById("dob").value
    };

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {
        const response = await fetch("http://localhost:3000/api/profile", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(updatedProfile)
        });
        const data = await response.json();

        if (response.status === 401) return logOut();
        if (!response.ok) {
            showProfileMessage(data.message || "Unable to save profile.");
            return;
        }

        showProfileMessage(data.message, "success");
    } catch (error) {
        showProfileMessage("Could not contact the server. Please try again.");
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = "Save Changes";
    }
});
