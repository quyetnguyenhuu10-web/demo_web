// SidebarMenu.jsx - Menu sidebar với đăng nhập/đăng ký Clerk
import { SignedIn, SignedOut, SignIn, SignUp, SignOutButton, useUser } from "@clerk/clerk-react";
import { useState } from "react";

// Component khi có Clerk (dùng hooks)
function ClerkSidebarMenu() {
  const { user, isLoaded } = useUser();
  const [authMode, setAuthMode] = useState("signin"); // "signin" hoặc "signup"

  // Lấy initials từ tên user
  const getInitials = (user) => {
    if (!user) return "U";
    if (user.firstName && user.lastName) {
      return (user.firstName[0] + user.lastName[0]).toUpperCase();
    }
    if (user.firstName) {
      return user.firstName[0].toUpperCase();
    }
    if (user.emailAddresses?.[0]?.emailAddress) {
      return user.emailAddresses[0].emailAddress[0].toUpperCase();
    }
    return "U";
  };

  // Lấy tên hiển thị
  const getDisplayName = (user) => {
    if (!user) return "User";
    if (user.firstName) {
      return user.firstName;
    }
    if (user.emailAddresses?.[0]?.emailAddress) {
      return user.emailAddresses[0].emailAddress.split("@")[0];
    }
    return "User";
  };

  // Lấy thông tin phụ (subscription/role hoặc email)
  const getSubInfo = (user) => {
    // Có thể lấy từ metadata hoặc email domain
    if (user?.emailAddresses?.[0]?.emailAddress) {
      const domain = user.emailAddresses[0].emailAddress.split("@")[1];
      // Hoặc có thể check subscription từ metadata
      return "Plus"; // Tạm thời hardcode, có thể lấy từ user metadata
    }
    return "";
  };

  return (
    <div className="sidebarMenu">
      {/* Khi đã đăng nhập */}
      <SignedIn>
        {/* Phần trên: List items (có thể là recent chats/conversations) */}
        <div className="sidebarListSection">
          {/* Có thể thêm list items sau */}
        </div>

        {/* Separator */}
        <div className="sidebarSeparator"></div>

        {/* Phần dưới: User profile - y hệt như hình, gần đáy */}
        <div className="sidebarUserProfile">
          <div className="sidebarUserInfoRow">
            <div className="sidebarUserAvatar">
              {user?.imageUrl ? (
                <img 
                  src={user.imageUrl} 
                  alt={getDisplayName(user)}
                  className="sidebarAvatarImg"
                />
              ) : (
                <div className="sidebarAvatarPlaceholder">
                  {getInitials(user)}
                </div>
              )}
            </div>
            <div className="sidebarUserText">
              <div className="sidebarUserName">
                {getDisplayName(user)}
              </div>
              <div className="sidebarUserSubInfo">
                {getSubInfo(user)}
              </div>
            </div>
          </div>
          <div className="sidebarUserActions">
            <SignOutButton>
              <button className="sidebarSignOutBtn" type="button">
                Đăng xuất
              </button>
            </SignOutButton>
          </div>
        </div>
      </SignedIn>

      {/* Khi chưa đăng nhập */}
      <SignedOut>
        <div className="sidebarAuthSection">
          <div className="sidebarAuthHeader">
            <h2 className="sidebarAuthTitle">Đăng nhập</h2>
            <p className="sidebarAuthSubtitle">Đăng nhập để sử dụng ứng dụng</p>
          </div>
          <div className="sidebarAuthForms">
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
                        padding: "16px",
                        boxShadow: "none"
                      },
                      headerTitle: {
                        fontSize: "16px",
                        fontWeight: "700",
                        color: "var(--text)"
                      },
                      headerSubtitle: {
                        fontSize: "12px",
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
                <div className="sidebarAuthSwitch">
                  <p style={{ fontSize: "12px", color: "var(--muted)", margin: "8px 0 0 0", textAlign: "center" }}>
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
                        padding: "16px",
                        boxShadow: "none"
                      },
                      headerTitle: {
                        fontSize: "16px",
                        fontWeight: "700",
                        color: "var(--text)"
                      },
                      headerSubtitle: {
                        fontSize: "12px",
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
                <div className="sidebarAuthSwitch">
                  <p style={{ fontSize: "12px", color: "var(--muted)", margin: "8px 0 0 0", textAlign: "center" }}>
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
      </SignedOut>
    </div>
  );
}

// Component khi không có Clerk (không dùng hooks)
function NoAuthSidebarMenu() {
  return (
    <div className="sidebarMenu">
      <div className="sidebarAuthSection">
        <div className="sidebarAuthHeader">
          <h2 className="sidebarAuthTitle">Authentication</h2>
          <p className="sidebarAuthSubtitle">Clerk authentication is not configured.</p>
        </div>
      </div>
    </div>
  );
}

// Main component - kiểm tra và render component phù hợp
export default function SidebarMenu() {
  // Kiểm tra xem có Clerk key không
  const hasClerkKey = typeof import.meta !== 'undefined' && 
    Boolean(import.meta.env?.VITE_CLERK_PUBLISHABLE_KEY?.trim());
  
  // Nếu không có Clerk key, render component không dùng hooks
  if (!hasClerkKey) {
    return <NoAuthSidebarMenu />;
  }
  
  // Nếu có Clerk key, ClerkWrapper đã wrap app với ClerkProvider
  // Nên có thể dùng Clerk hooks an toàn
  return <ClerkSidebarMenu />;
}
