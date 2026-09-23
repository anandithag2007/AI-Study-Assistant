import { useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    setErrorMessage("");

    if (!email.trim() || !password.trim()) {
      setErrorMessage(
        "Please enter both your email and password."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem(
        "token",
        response.data.token
      );

      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);

      setErrorMessage(
        error.response?.data?.message ||
          "Login failed. Please check your email and password."
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

        {/* Login card */}

        <div className="auth-card">

          <div className="auth-header">
            <div className="auth-welcome">
              WELCOME
            </div>

            <h2>Continue learning</h2>

            <p>
              Sign in to access your study dashboard
              and continue where you left off.
            </p>
          </div>

          <form
            className="auth-form"
            onSubmit={handleLogin}
          >

            {/* Email */}

            <div className="auth-field">
              <label htmlFor="login-email">
                Email
              </label>

              <input
                id="login-email"
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
  <label htmlFor="login-password">
    Password
  </label>

  <div className="password-input-wrapper">
    <input
      id="login-password"
      type={showPassword ? "text" : "password"}
      value={password}
      onChange={(e) =>
        setPassword(e.target.value)
      }
      placeholder="Enter your password"
      autoComplete="current-password"
    />

    <button
      type="button"
      className="password-toggle"
      onClick={() =>
        setShowPassword((previous) => !previous)
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

            {/* Login button */}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="button-spinner"></span>
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <span className="button-arrow">
                    →
                  </span>
                </>
              )}
            </button>

          </form>

          {/* Register */}

          <div className="auth-footer">
            <span>
              Don't have an account?
            </span>

            <button
              type="button"
              className="auth-link"
              onClick={() => navigate("/register")}
            >
              Create an account
            </button>
          </div>

        </div>

        {/* Small footer */}

        <p className="auth-bottom-text">
          Learn smarter. Study better. Go further.
        </p>

      </div>
    </div>
  );
}

export default Login;