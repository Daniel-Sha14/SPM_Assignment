$(document).ready(function () {
    const APIKEY = "668634bc48293b3118032aaa";

    $("#contact-submit").on("click", function (e) {
        e.preventDefault();

        let contactName = $("#contact-name").val();
        let contactEmail = $("#contact-email").val();
        let contactPassword = $("#contact-password").val();
        
        let jsondata = {
            "name": contactName,
            "email": contactEmail,
            "password": contactPassword,
        };

        // First, check if the email already exists in the database
        $.ajax({
            "async": true,
            "crossDomain": true,
            "url": "https://spmassg-bd26.restdb.io/rest/user-info",
            "method": "GET",
            "headers": {
                "content-type": "application/json",
                "x-apikey": APIKEY,
                "cache-control": "no-cache"
            },
            success: function (response) {
                // Check if the email is already registered
                let emailExists = response.some(user => user.email === contactEmail);

                if (emailExists) {
                    alert("An account with this email already exists. Please use a different email.");
                    $("#contact-submit").prop("disabled", false);
                } else {
                    // Email does not exist, proceed with creating a new user
                    let settings = {
                        "async": true,
                        "crossDomain": true,
                        "url": "https://spmassg-bd26.restdb.io/rest/user-info",
                        "method": "POST",
                        "headers": {
                            "content-type": "application/json",
                            "x-apikey": APIKEY,
                            "cache-control": "no-cache"
                        },
                        "processData": false,
                        "data": JSON.stringify(jsondata),
                        beforeSend: function(){
                            $("#contact-submit").prop("disabled", true);
                            $("#signup-form").trigger("reset");
                        }
                    };

                    $.ajax(settings).done(function (response) {
                        console.log(response);
                        $("#contact-submit").prop("disabled", false);
                        window.location.href = "../html/login.html"; // Redirect to login.html
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        console.error("Error:", textStatus, errorThrown);
                        alert("An error occurred while submitting the contact form. Please try again.");
                        $("#contact-submit").prop("disabled", false);
                    });
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.error("Error:", textStatus, errorThrown);
                alert("An error occurred while checking the email. Please try again.");
                $("#contact-submit").prop("disabled", false);
            }
        });
    });

    // Login form submission
    $("#login-form").submit(function (e) {
        e.preventDefault();

        let email = $("#Email").val();
        let password = $("#Password").val();

        if (email.trim() === "" || password.trim() === "") {
            alert("Please enter both email and password.");
            return;
        }

        let userData = {
            "email": email,
            "password": password
        };

        $.ajax({
            url: "https://spmassg-bd26.restdb.io/rest/user-info",
            type: "GET",
            headers: {
                "x-apikey": APIKEY,
                "content-type": "application/json"
            },
            success: function (response) {
                if (response.length > 0) {
                    for (let i = 0; i < response.length; i++) {
                        if (response[i].password === userData.password && response[i].email === userData.email) {
                            localStorage.setItem('loggedInUser', JSON.stringify(response[i]));
                            window.location.href = "../index.html";
                            return;
                        }
                    }
                    alert("Invalid email or password. Please try again.");
                } else {
                    alert("Invalid email or password. Please try again.");
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error("Error:", textStatus, errorThrown);
                alert("An error occurred while logging in. Please try again.");
            }
        });
    });
});
