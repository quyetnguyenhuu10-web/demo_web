// auth-utils.js - ABAC Authorization Utilities
// Kiểm tra trạng thái authorization từ Clerk Public Metadata

/**
 * Kiểm tra xem user có được authorized không
 * @param {Object} user - Clerk user object (từ useUser hook)
 * @returns {Object} { isAuthorized: boolean, state: 'unauthenticated' | 'viewer' | 'authorized' | 'trusted' | 'admin', isTrusted: boolean, isAdmin: boolean, isReadOnly: boolean }
 */
export function checkAuthorization(user) {
  // State 0: Unauthenticated
  if (!user || !user.id) {
    return { isAuthorized: false, state: 'unauthenticated', isTrusted: false, isAdmin: false, isReadOnly: false };
  }

  // Kiểm tra Public Metadata
  const publicMetadata = user.publicMetadata || {};
  const authorized = publicMetadata.authorized === true;
  const readonly = publicMetadata.readonly === true;
  const trusted = publicMetadata.trusted === true;
  const admin = publicMetadata.admin === true;

  // Nếu chưa có authorized, tự động coi như viewer (readonly)
  // Không còn trạng thái pending - tất cả user đăng nhập đều được coi như viewer mặc định
  if (!authorized) {
    return { isAuthorized: true, state: 'viewer', isTrusted: false, isAdmin: false, isReadOnly: true };
  }

  // Authorized users
  if (admin) {
    // Admin
    return { isAuthorized: true, state: 'admin', isTrusted: true, isAdmin: true, isReadOnly: false };
  } else if (trusted) {
    // Trusted
    return { isAuthorized: true, state: 'trusted', isTrusted: true, isAdmin: false, isReadOnly: false };
  } else if (readonly) {
    // Viewer (read-only)
    return { isAuthorized: true, state: 'viewer', isTrusted: false, isAdmin: false, isReadOnly: true };
  } else {
    // Authorized (user thường - có thể tương tác)
    return { isAuthorized: true, state: 'authorized', isTrusted: false, isAdmin: false, isReadOnly: false };
  }
}

/**
 * Kiểm tra authorization và throw error nếu không authorized
 * Dùng trong API calls để abort trước khi gửi request
 */
export function requireAuthorization(user) {
  const { isAuthorized, state } = checkAuthorization(user);
  
  if (!isAuthorized) {
    if (state === 'unauthenticated') {
      throw new Error('UNAUTHENTICATED: Please sign in first');
    }
  }
  
  return true;
}
