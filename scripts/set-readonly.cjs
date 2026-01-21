// set-readonly.cjs - Set user làm viewer (read-only: chỉ xem, không tương tác)
// Usage: node scripts/set-readonly.cjs <user-email-or-id>
// ⚠️ CHỈ ADMIN MỚI CHẠY ĐƯỢC

require("dotenv").config({ path: ".env" });

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
  console.error("❌ CLERK_SECRET_KEY is not set in .env file");
  process.exit(1);
}

async function setReadOnly(userIdentifier) {
  try {
    const { createClerkClient } = require("@clerk/backend");
    const client = createClerkClient({ secretKey: CLERK_SECRET_KEY });

    // Tìm user theo email hoặc ID
    let user;
    if (userIdentifier.includes("@")) {
      const users = await client.users.getUserList({
        emailAddress: [userIdentifier],
      });
      if (users.data.length === 0) {
        console.error(`❌ User not found with email: ${userIdentifier}`);
        process.exit(1);
      }
      user = users.data[0];
    } else {
      try {
        user = await client.users.getUser(userIdentifier);
      } catch (e) {
        console.error(`❌ User not found with ID: ${userIdentifier}`);
        process.exit(1);
      }
    }

    // Update metadata: set readonly (không set admin/trusted)
    const updatedUser = await client.users.updateUser(user.id, {
      publicMetadata: {
        ...user.publicMetadata, // Giữ lại metadata cũ
        authorized: true, // Phải có authorized để vào app
        readonly: true, // Set readonly
        // Không set admin hoặc trusted - viewer không có quyền này
      },
    });

    console.log("\n✅ User đã được set làm Viewer (Read-only):");
    console.log(`   ID: ${updatedUser.id}`);
    console.log(`   Email: ${updatedUser.primaryEmailAddress?.emailAddress || "N/A"}`);
    console.log(`   Authorized: ${updatedUser.publicMetadata?.authorized === true ? "✅" : "❌"}`);
    console.log(`   Read-only: ${updatedUser.publicMetadata?.readonly === true ? "✅" : "❌"}`);
    console.log(`   Trusted: ${updatedUser.publicMetadata?.trusted === true ? "✅" : "❌"}`);
    console.log(`   Admin: ${updatedUser.publicMetadata?.admin === true ? "✅" : "❌"}`);
    console.log("\n");
    console.log("ℹ️  Viewer chỉ có thể xem app, không thể gửi tin nhắn hoặc tương tác.\n");

  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.errors) {
      console.error("   Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  }
}

// Main
const userIdentifier = process.argv[2];

if (!userIdentifier) {
  console.error("❌ Usage: node scripts/set-readonly.cjs <user-email-or-id>");
  console.error("   Example: node scripts/set-readonly.cjs user@example.com");
  console.error("   Example: node scripts/set-readonly.cjs user_2abc123xyz");
  console.error("\n⚠️  LƯU Ý: Chỉ admin mới nên chạy script này.");
  process.exit(1);
}

setReadOnly(userIdentifier);
