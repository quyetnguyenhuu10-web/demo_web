// SidebarMenu.jsx - Menu sidebar với user profile
import { SignedIn, SignedOut, SignOutButton, useUser } from "@clerk/clerk-react";

// Component khi có Clerk (dùng hooks)
function ClerkSidebarMenu() {
  const { user, isLoaded } = useUser();

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

      {/* Khi chưa đăng nhập - không hiển thị gì trong sidebar */}
      <SignedOut>
        <div className="sidebarListSection">
          {/* Sidebar trống khi chưa đăng nhập */}
        </div>
      </SignedOut>
    </div>
  );
}

// Component khi không có Clerk (không dùng hooks)
function NoAuthSidebarMenu() {
  // Không hiển thị gì khi không có Clerk - sidebar trống
  return (
    <div className="sidebarMenu">
      <div className="sidebarListSection">
        {/* Sidebar trống khi không có Clerk */}
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
