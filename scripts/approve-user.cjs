// approve-user.cjs - Approve user (set authorized: true)
// Usage: node scripts/approve-user.cjs <user-email-or-id> [--trusted-user-id <id>]
// ⚠️ CHỈ TRUSTED USER HOẶC ADMIN MỚI CHẠY ĐƯỢC

require("dotenv").config({ path: ".env" });

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
  console.error("❌ CLERK_SECRET_KEY is not set in .env file");
  process.exit(1);
}

async function approveUser(targetUserIdentifier, trustedUserId) {
  try {
    const { createClerkClient } = require("@clerk/backend");
    const client = createClerkClient({ secretKey: CLERK_SECRET_KEY });

    // Kiểm tra quyền của người chạy script (nếu có trustedUserId)
    if (trustedUserId) {
      const trustedUser = await client.users.getUser(trustedUserId);
      const isAdmin = trustedUser.publicMetadata?.admin === true;
      const isTrusted = trustedUser.publicMetadata?.trusted === true;

      if (!isAdmin && !isTrusted) {
        console.error("❌ Bạn không có quyền approve user.");
        console.error("   Cần có quyền admin hoặc trusted.");
        process.exit(1);
      }

      console.log(`✅ Verified: ${isAdmin ? "Admin" : "Trusted User"} - ${trustedUser.primaryEmailAddress?.emailAddress || "N/A"}\n`);
    }

    // Tìm user cần approve
    let targetUser;
    if (targetUserIdentifier.includes("@")) {
      const users = await client.users.getUserList({
        emailAddress: [targetUserIdentifier],
      });
      if (users.data.length === 0) {
        console.error(`❌ User not found with email: ${targetUserIdentifier}`);
        process.exit(1);
      }
      targetUser = users.data[0];
    } else {
      try {
        targetUser = await client.users.getUser(targetUserIdentifier);
      } catch (e) {
        console.error(`❌ User not found with ID: ${targetUserIdentifier}`);
        process.exit(1);
      }
    }

    // Update metadata: chỉ set authorized, không thay đổi admin/trusted
    const updatedUser = await client.users.updateUser(targetUser.id, {
      publicMetadata: {
        ...targetUser.publicMetadata, // Giữ lại metadata cũ
        authorized: true,
      },
    });

    console.log("\n✅ User đã được approve:");
    console.log(`   ID: ${updatedUser.id}`);
    console.log(`   Email: ${updatedUser.primaryEmailAddress?.emailAddress || "N/A"}`);
    console.log(`   Authorized: ${updatedUser.publicMetadata?.authorized === true ? "✅" : "❌"}`);
    console.log(`   Trusted: ${updatedUser.publicMetadata?.trusted === true ? "✅" : "❌"}`);
    console.log(`   Admin: ${updatedUser.publicMetadata?.admin === true ? "✅" : "❌"}`);
    console.log("\n");

  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.errors) {
      console.error("   Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  }
}

// Parse arguments
const args = process.argv.slice(2);
let targetUserIdentifier = null;
let trustedUserId = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--trusted-user-id" && i + 1 < args.length) {
    trustedUserId = args[i + 1];
    i++;
  } else if (!targetUserIdentifier) {
    targetUserIdentifier = args[i];
  }
}

if (!targetUserIdentifier) {
  console.error("❌ Usage: node scripts/approve-user.cjs <user-email-or-id> [--trusted-user-id <id>]");
  console.error("   Example: node scripts/approve-user.cjs user@example.com");
  console.error("   Example: node scripts/approve-user.cjs user_2abc123xyz --trusted-user-id user_trusted123");
  console.error("\n⚠️  LƯU Ý: Chỉ trusted user hoặc admin mới chạy được script này.");
  process.exit(1);
}

approveUser(targetUserIdentifier, trustedUserId);
