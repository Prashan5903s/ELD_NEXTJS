"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { debounce } from "lodash";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import LoadingIcons from "react-loading-icons";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { Modal, Button } from "react-bootstrap";

// Validation schema
const schema = yup
  .object({
    email: yup.string().email("Invalid email address").required("Email is required"),
    password: yup
      .string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  })
  .required();

type ForceLogInModalProps = {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const ForceLogInModal: React.FC<ForceLogInModalProps> = ({
  show,
  onClose,
  onConfirm,
}) => {
  return (
    <Modal show={show} onHide={onClose} centered size="sm">
      <Modal.Header closeButton style={{ padding: "8px 12px" }}>
        <Modal.Title style={{ fontSize: "16px" }}>Login Detected</Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ height: "100px" }}>
        You are already logged in on another device. <br />
        Do you want to continue and log out from the other session?
      </Modal.Body>

      <Modal.Footer
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "8px 12px",
        }}
      >
        <Button variant="primary" onClick={onConfirm} size="sm">
          Continue
        </Button>
        <Button variant="secondary" onClick={onClose} size="sm">
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

function Login() {
  interface User {
    token: string;
    user_type: string;
    master_user_type: string;
  }

  interface SessionData {
    user?: User;
  }

  const { data: session } = useSession() as { data?: SessionData };
  const token = session?.user?.token;
  const router = useRouter();
  const url = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  const [masterUser, setMasterUserType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forceLogIn, setForceLogIn] = useState(false);

  // store last form data so we can reuse on Force Login
  const lastFormData = useRef<any>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (session) {
      const userType = session.user?.user_type;
      const masterUserType = session.user?.master_user_type;

      setMasterUserType(masterUserType ?? null);
      if (userType === "EC") {
        router.replace("/company/page");
      } else if (userType === "TR") {
        router.replace("/dashboard");
      } else if (userType === "U" && masterUserType === "TR") {
        router.replace("/drivers");
      }
      window.location.reload();
    }
  }, [session, router]);

  useEffect(() => {
    if (token) {
      axios
        .get(`${url}/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          const userType = response.data.user_type;

          if (userType === "EC") {
            router.push("/company/dashboard");
          } else if (userType === "TR") {
            router.push("/dashboard");
          } else if (userType === "U" && masterUser === "TR") {
            router.push("/drivers");
          }
          window.location.reload();
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
          router.push("/");
        });
    }
  }, [router, url, token, masterUser]);

  const LogInData = useCallback(
    debounce(async (data: any, forceFlag: string = "0") => {
      if (!data) return; // safety
      setIsLoading(true);

      try {
        const result = await signIn("credentials", {
          redirect: false,
          ...data,
          force: forceFlag,
        });

        if (result?.error) {

          if (result.status === 401) {
            if (result.error === "You are already logged in on another device.") {
              setForceLogIn(true);
              return;
            }

            if (result.error === "CredentialsSignin") {
              setError("password", {
                type: "manual",
                message: "Wrong user credential",
              });
            } else {
              setError("password", {
                type: "manual",
                message: result.error || "Wrong user credential",
              });
            }
          } else {
            setError("password", { type: "manual", message: result.error });
          }
        } else {
          setForceLogIn(false);

          const userType = data.user_type;
          if (userType === "EC") {
            router.push("/company/page");
          } else if (userType === "TR") {
            router.push("/dashboard");
          } else {
            router.push("/");
          }

          window.location.reload();
        }
      } catch (error) {
        console.error("Error logging in:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  const onSubmit = async (data: any) => {
    lastFormData.current = data; // save latest form values
    LogInData(data, "0");
  };

  return (
    <>
      <form
        className="form w-100"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        id="kt_login_signin_form"
      >
        <ForceLogInModal
          show={forceLogIn}
          onClose={() => setForceLogIn(false)}
          onConfirm={() => {
            setForceLogIn(false);
            if (lastFormData.current) {
              LogInData(lastFormData.current, "1");
            }
          }}
        />

        <div className="text-center mb-11">
          <h1 className="text-gray-900 fw-bolder mb-3">Sign In</h1>
        </div>

        <div className="fv-row mb-8">
          <label className="form-label fs-6 fw-bolder text-gray-900">Email</label>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                placeholder="Email"
                className="form-control bg-transparent"
                type="email"
                autoComplete="off"
              />
            )}
          />
          {errors.email && (
            <div className="text-danger">{errors.email.message}</div>
          )}
        </div>

        <div className="fv-row mb-3">
          <label className="form-label fw-bolder text-gray-900 fs-6 mb-0">
            Password
          </label>
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <div className="position-relative">
                <input
                  {...field}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
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
            )}
          />
          {errors.password && (
            <div className="text-danger">{errors.password.message}</div>
          )}
        </div>

        <div className="d-flex flex-stack flex-wrap gap-3 fs-base fw-semibold mb-8">
          <div />
          <Link href="/Auth/ResetPassword" className="link-primary">
            Forgot Password ?
          </Link>
        </div>

        <div className="d-grid mb-10">
          <button
            id="kt_sign_in_submit"
            className="justify-content-center btn-primary"
            disabled={isLoading}
          >
            <span className="indicator-progress d-flex justify-content-center">
              {isLoading ? <LoadingIcons.TailSpin height={18} /> : "Login"}
            </span>
          </button>
        </div>
      </form>
    </>
  );
}

export default Login;
