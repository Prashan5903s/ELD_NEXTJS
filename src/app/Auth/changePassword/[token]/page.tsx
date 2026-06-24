"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";

const initialValues = {
  email: "",
  password: "",
  password_confirmation: "",
};

export default function NewPasswordForm(param) {
  const [formValues, setFormValues] = useState(initialValues);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Separate state for confirm password
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [token, setToken] = useState("");

  const tokens = param.params.token;

  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const router = useRouter();
  const pathName = usePathname();

  useEffect(() => {
    const email = localStorage.getItem("emailVal");
    setFormValues((prevValues) => ({ ...prevValues, email }));

    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get("token");
    setToken(token);
  }, [router, pathName]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prevValues) => ({ ...prevValues, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    if (!formValues.password || !formValues.password_confirmation) {
      setError("Both password fields are required.");
      setLoading(false);
      return;
    }

    if (
      formValues.password.length < 8 ||
      formValues.password_confirmation.length < 8
    ) {
      setError("Passwords must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    if (formValues.password !== formValues.password_confirmation) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${url}/reset/change/password/${tokens}`,
        {
          ...formValues,
        }
      );
      setMessage(response.data.message);

      setTimeout(() => {
        router.push("/");
      }, 500);
    } catch (error) {
      setError("Failed to reset password");
      if (error.response && error.response.data) {
        setError(error.response.data.error || "Failed to reset password");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-center flex-column flex-lg-row-fluid">
      <div className="w-lg-500px p-10">
        <form
          className="form w-100 fv-plugins-bootstrap5 fv-plugins-framework"
          noValidate
          onSubmit={handleSubmit}
          id="kt_new_password_form"
        >
          <div className="text-center mb-10">
            <h1 className="text-gray-900 fw-bolder mb-3">Setup New Password</h1>
            <div className="text-gray-500 fw-semibold fs-6">
              Have you already reset the password?
              <Link href="/">
                <span className="link-primary fw-bold">Sign in</span>
              </Link>
            </div>
          </div>

          {message && (
            <div className="alert alert-success">
              <div className="alert-text font-weight-bold">{message}</div>
            </div>
          )}
          {error && (
            <div className="alert alert-danger">
              <div className="alert-text font-weight-bold">{error}</div>
            </div>
          )}

          {/* New Password Field */}
          <div className="fv-row mb-8">
            <label className="form-label fw-bolder text-gray-900 fs-6">
              New Password
            </label>
            <div className="position-relative mb-3">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                name="password"
                value={formValues.password}
                onChange={handleChange}
                autoComplete="off"
                className="form-control bg-transparent"
              />
              <span
                role="button"
                className="position-absolute top-50 start-100 translate-middle"
                style={{ paddingRight: "2.5rem", fontSize: "large" }}
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? (
                  <i className="ki-duotone ki-eye-slash">
                    <span className="path1"></span>
                    <span className="path2"></span>
                    <span className="path3"></span>
                    <span className="path4"></span>
                  </i>
                ) : (
                  <i className="ki-duotone ki-eye">
                    <span className="path1"></span>
                    <span className="path2"></span>
                    <span className="path3"></span>
                  </i>
                )}
              </span>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="fv-row mb-8">
            <label className="form-label fw-bolder text-gray-900 fs-6">
              Confirm Password
            </label>
            <div className="position-relative mb-3">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                name="password_confirmation"
                value={formValues.password_confirmation}
                onChange={handleChange}
                autoComplete="off"
                className="form-control bg-transparent"
              />
              <span
                role="button"
                className="position-absolute top-50 start-100 translate-middle"
                style={{ paddingRight: "2.5rem", fontSize: "large" }}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? (
                  <i className="ki-duotone ki-eye-slash">
                    <span className="path1"></span>
                    <span className="path2"></span>
                    <span className="path3"></span>
                    <span className="path4"></span>
                  </i>) : (
                  <i className="ki-duotone ki-eye">
                    <span className="path1"></span>
                    <span className="path2"></span>
                    <span className="path3"></span>
                  </i>
                )}
              </span>
            </div>
          </div>

          <div className="text-center">
            <button
              type="submit"
              className="d-flex justify-content-center align-items-center btn btn-lg btn-primary w-100 mb-5"
              disabled={loading}
            >
              {loading ? (
                <>
                  Please wait...
                  <span className="spinner-border spinner-border-sm align-middle ms-2"></span>
                </>
              ) : (
                "Reset Password"
              )}
            </button>
            <Link href="/">
              <button
                type="button"
                className="btn btn-lg w-100 mb-5"
              >
                Cancel
              </button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
