// AuthModal.jsx - Modal đăng nhập/đăng ký ở giữa màn hình
import { SignedOut, SignIn, SignUp } from "@clerk/clerk-react";
import { useState } from "react";

export default function AuthModal() {
  const [authMode, setAuthMode] = useState("signin"); // "signin" hoặc "signup"

  return (
    <div className="authModalOverlay">
      <div className="authModalContainer">
        {authMode === "signin" ? (
          <>
            <SignIn 
              routing="hash"
              appearance={{
                elements: {
                  rootBox: {
                    width: "100%",
                    maxWidth: "100%"
                  },
                  card: {
                    width: "100%",
                    maxWidth: "100%",
                    background: "var(--panel)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    padding: "20px",
                    boxShadow: "none"
                  },
                  headerTitle: {
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "var(--text)"
                  },
                  headerSubtitle: {
                    fontSize: "13px",
                    color: "var(--muted)"
                  },
                  socialButtonsBlockButton: {
                    borderRadius: "6px",
                    fontWeight: "600"
                  },
                  formButtonPrimary: {
                    background: "var(--accent)",
                    color: "var(--text)",
                    borderRadius: "6px",
                    fontWeight: "600"
                  },
                  formFieldInput: {
                    background: "var(--bg-soft)",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    color: "var(--text)"
                  },
                  footerActionLink: {
                    color: "var(--accent)"
                  }
                }
              }}
            />
            <div className="authModalSwitch">
              <p style={{ fontSize: "12px", color: "var(--muted)", margin: "12px 0 0 0", textAlign: "center" }}>
                Chưa có tài khoản?{" "}
                <a 
                  href="#sign-up" 
                  onClick={(e) => {
                    e.preventDefault();
                    setAuthMode("signup");
                  }}
                  style={{ color: "var(--accent)", textDecoration: "none", cursor: "pointer" }}
                >
                  Đăng ký
                </a>
              </p>
            </div>
          </>
        ) : (
          <>
            <SignUp 
              routing="hash"
              appearance={{
                elements: {
                  rootBox: {
                    width: "100%",
                    maxWidth: "100%"
                  },
                  card: {
                    width: "100%",
                    maxWidth: "100%",
                    background: "var(--panel)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    padding: "20px",
                    boxShadow: "none"
                  },
                  headerTitle: {
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "var(--text)"
                  },
                  headerSubtitle: {
                    fontSize: "13px",
                    color: "var(--muted)"
                  },
                  socialButtonsBlockButton: {
                    borderRadius: "6px",
                    fontWeight: "600"
                  },
                  formButtonPrimary: {
                    background: "var(--accent)",
                    color: "var(--text)",
                    borderRadius: "6px",
                    fontWeight: "600"
                  },
                  formFieldInput: {
                    background: "var(--bg-soft)",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    color: "var(--text)"
                  },
                  footerActionLink: {
                    color: "var(--accent)"
                  }
                }
              }}
            />
            <div className="authModalSwitch">
              <p style={{ fontSize: "12px", color: "var(--muted)", margin: "12px 0 0 0", textAlign: "center" }}>
                Đã có tài khoản?{" "}
                <a 
                  href="#sign-in" 
                  onClick={(e) => {
                    e.preventDefault();
                    setAuthMode("signin");
                  }}
                  style={{ color: "var(--accent)", textDecoration: "none", cursor: "pointer" }}
                >
                  Đăng nhập
                </a>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
