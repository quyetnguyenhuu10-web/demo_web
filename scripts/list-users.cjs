// list-users.cjs - Script để list tất cả users và trạng thái của họ
// Usage: node scripts/list-users.cjs

require("dotenv").config({ path: ".env" });

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
  console.error("❌ CLERK_SECRET_KEY is not set in .env file");
  process.exit(1);
}

async function listUsers() {
  try {
    const { createClerkClient } = require("@clerk/backend");
    const client = createClerkClient({ secretKey: CLERK_SECRET_KEY });

    let allUsers = [];
    let hasMore = true;
    let offset = 0;
    const limit = 500;

    // Fetch tất cả users (pagination)
    while (hasMore) {
      const response = await client.users.getUserList({
        limit,
        offset,
      });

      allUsers = allUsers.concat(response.data);
      hasMore = response.data.length === limit;
      offset += limit;
    }

    console.log(`\n📋 Tổng số users: ${allUsers.length}\n`);

    if (allUsers.length === 0) {
      console.log("   (Chưa có user nào)");
      return;
    }

    // Hiển thị thông tin từng user
    allUsers.forEach((user, index) => {
      const email = user.primaryEmailAddress?.emailAddress || "N/A";
      const authorized = user.publicMetadata?.authorized === true;
      const admin = user.publicMetadata?.admin === true;
      const trusted = user.publicMetadata?.trusted === true;
      const readonly = user.publicMetadata?.readonly === true;
      const createdAt = new Date(user.createdAt).toLocaleString("vi-VN");

      console.log(`${index + 1}. ${email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${createdAt}`);
      console.log(`   Authorized: ${authorized ? "✅" : "❌"}`);
      console.log(`   Read-only (Viewer): ${readonly ? "✅" : "❌"}`);
      console.log(`   Trusted: ${trusted ? "✅" : "❌"}`);
      console.log(`   Admin: ${admin ? "✅" : "❌"}`);
      console.log("");
    });

    // Summary
    const authorizedCount = allUsers.filter(
      (u) => u.publicMetadata?.authorized === true
    ).length;
    const adminCount = allUsers.filter(
      (u) => u.publicMetadata?.admin === true
    ).length;
    const trustedCount = allUsers.filter(
      (u) => u.publicMetadata?.trusted === true
    ).length;
    const readonlyCount = allUsers.filter(
      (u) => u.publicMetadata?.readonly === true
    ).length;

    console.log("📊 Summary:");
    console.log(`   Total: ${allUsers.length}`);
    console.log(`   Authorized: ${authorizedCount}`);
    console.log(`   Read-only (Viewer): ${readonlyCount}`);
    console.log(`   Trusted: ${trustedCount}`);
    console.log(`   Admin: ${adminCount}`);
    console.log(`   Pending: ${allUsers.length - authorizedCount}\n`);

  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.errors) {
      console.error("   Details:", JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  }
}

listUsers();
