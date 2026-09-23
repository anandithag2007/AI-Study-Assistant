import { useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import "./Register.css";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    setErrorMessage("");

    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim()
    ) {
      setErrorMessage(
        "Please fill in all the fields."
      );
      return;
    }

    try {
      setLoading(true);

      await api.post("/auth/register", {
        name,
        email,
        password,
      });

      navigate("/");
    } catch (error) {
      console.error("Registration error:", error);

      setErrorMessage(
        error.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* Background decoration */}

      <div className="auth-decoration decoration-one"></div>
      <div className="auth-decoration decoration-two"></div>

      <div className="auth-container">

        {/* Brand */}

        <div className="auth-brand">
          <div className="auth-brand-icon">
            AI
          </div>

          <div>
            <h1>AI Study Assistant</h1>
            <p>Your personal study space</p>
          </div>
        </div>

        {/* Register card */}

        <div className="auth-card">

          <div className="auth-header">
            <div className="auth-welcome">
              GET STARTED
            </div>

            <h2>Create your account</h2>

            <p>
              Create your account and start your
              personalized learning journey.
            </p>
          </div>

          <form
            className="auth-form"
            onSubmit={handleRegister}
          >

            {/* Name */}

            <div className="auth-field">
              <label htmlFor="register-name">
                Name
              </label>

              <input
                id="register-name"
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Enter your name"
                autoComplete="name"
              />
            </div>

            {/* Email */}

            <div className="auth-field">
              <label htmlFor="register-email">
                Email
              </label>

              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="Enter your email"
                autoComplete="email"
              />
            </div>

            {/* Password */}

            <div className="auth-field">
              <label htmlFor="register-password">
                Password
              </label>

              <div className="password-input-wrapper">
                <input
                  id="register-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Create a password"
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? "◉" : "○"}
                </button>
              </div>
            </div>

            {/* Error */}

            {errorMessage && (
              <div className="auth-error">
                <span className="error-icon">
                  !
                </span>

                <span>{errorMessage}</span>
              </div>
            )}

            {/* Register button */}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="button-spinner"></span>
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <span className="button-arrow">
                    →
                  </span>
                </>
              )}
            </button>

          </form>

          {/* Login */}

          <div className="auth-footer">
            <span>
              Already have an account?
            </span>

            <button
              type="button"
              className="auth-link"
              onClick={() => navigate("/")}
            >
              Sign in
            </button>
          </div>

        </div>

        {/* Bottom text */}

        <p className="auth-bottom-text">
          Learn smarter. Study better. Go further.
        </p>

      </div>
    </div>
  );
}

export default Register;