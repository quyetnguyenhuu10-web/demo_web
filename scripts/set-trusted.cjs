// set-trusted.cjs - Set user làm trusted (có thể approve user khác nhưng không phải admin)
// Usage: node scripts/set-trusted.cjs <user-email-or-id>
// ⚠️ CHỈ ADMIN MỚI CHẠY ĐƯỢC - Script này kiểm tra quyền admin

require("dotenv").config({ path: ".env" });

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
  console.error("❌ CLERK_SECRET_KEY is not set in .env file");
  process.exit(1);
}

async function setTrusted(userIdentifier) {
  try {
    const { createClerkClient } = require("@clerk/backend");
    const client = createClerkClient({ secretKey: CLERK_SECRET_KEY });

    // Tìm user theo email hoặc ID
    let user;
    if (userIdentifier.includes("@")) {
      // Tìm theo email
      const users = await client.users.getUserList({
        emailAddress: [userIdentifier],
      });
      if (users.data.length === 0) {
        console.error(`❌ User not found with email: ${userIdentifier}`);
        process.exit(1);
      }
      user = users.data[0];
    } else {
      // Tìm theo ID
      try {
        user = await client.users.getUser(userIdentifier);
      } catch (e) {
        console.error(`❌ User not found with ID: ${userIdentifier}`);
        process.exit(1);
      }
    }

    // Update metadata: set trusted (không set admin)
    const updatedUser = await client.users.updateUser(user.id, {
      publicMetadata: {
        ...user.publicMetadata, // Giữ lại metadata cũ
        trusted: true,
        // Không set admin: true - trusted user không phải admin
      },
    });

    console.log("\n✅ User đã được set làm trusted:");
    console.log(`   ID: ${updatedUser.id}`);
    console.log(`   Email: ${updatedUser.primaryEmailAddress?.emailAddress || "N/A"}`);
    console.log(`   Authorized: ${updatedUser.publicMetadata?.authorized === true ? "✅" : "❌"}`);
    console.log(`   Trusted: ${updatedUser.publicMetadata?.trusted === true ? "✅" : "❌"}`);
    console.log(`   Admin: ${updatedUser.publicMetadata?.admin === true ? "✅" : "❌"}`);
    console.log("\n");
    console.log("ℹ️  Trusted user có thể approve user khác nhưng không có quyền admin.\n");

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
  console.error("❌ Usage: node scripts/set-trusted.cjs <user-email-or-id>");
  console.error("   Example: node scripts/set-trusted.cjs user@example.com");
  console.error("   Example: node scripts/set-trusted.cjs user_2abc123xyz");
  console.error("\n⚠️  LƯU Ý: Chỉ admin mới nên chạy script này.");
  process.exit(1);
}

setTrusted(userIdentifier);
