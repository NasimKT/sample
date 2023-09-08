const emailRegex = /^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;

function isPasswordValid(password) {
    var mess = "Password must be";

    // Check if the password is at least 8 characters long
    if (password.length < 8) {
        mess = mess + " 8 or more characters,";
    }

    // Check if the password contains at least one lowercase letter
    const lowercaseRegex = /[a-z]/;
    if (!lowercaseRegex.test(password)) {
        mess = mess + " at least one lowercase,";
    }

    // Check if the password contains at least one uppercase letter
    const uppercaseRegex = /[A-Z]/;
    if (!uppercaseRegex.test(password)) {
        mess = mess + " at least one uppercase,";
    }

    // Check if the password contains at least one digit
    const digitRegex = /\d/;
    if (!digitRegex.test(password)) {
        mess = mess + " at least one digit,";
    }

    // If no errors were found, return null; otherwise, return the error message
    if (mess === "Password must be") {
        return null;
    } else {
        return mess.slice(0, -1);
    }
}

function validateEmail(email) {
    return emailRegex.test(email);
}

module.exports = {
    isPasswordValid,
    validateEmail,
};
