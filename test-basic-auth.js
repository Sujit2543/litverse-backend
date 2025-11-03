// Test basic authentication endpoints
async function testBasicAuth() {
  console.log("🧪 Testing Basic Authentication Endpoints:");
  console.log("=" .repeat(50));

  // Test 1: Register with valid email
  try {
    console.log("1. Testing Registration...");
    const registerResponse = await fetch("http://localhost:5000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Test",
        lastName: "User",
        email: "test@gmail.com",
        password: "Password123!"
      }),
    });

    const registerData = await registerResponse.json();
    
    if (registerResponse.ok) {
      console.log("✅ Registration: SUCCESS");
    } else {
      console.log(`❌ Registration: ${registerData.message}`);
    }
  } catch (error) {
    console.log(`💥 Registration ERROR: ${error.message}`);
  }

  // Test 2: Login with valid credentials
  try {
    console.log("\n2. Testing Login...");
    const loginResponse = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@gmail.com",
        password: "Password123!"
      }),
    });

    const loginData = await loginResponse.json();
    
    if (loginResponse.ok) {
      console.log("✅ Login: SUCCESS");
      console.log(`Token: ${loginData.token.substring(0, 20)}...`);
    } else {
      console.log(`❌ Login: ${loginData.message}`);
    }
  } catch (error) {
    console.log(`💥 Login ERROR: ${error.message}`);
  }

  // Test 3: Admin login
  try {
    console.log("\n3. Testing Admin Login...");
    const adminResponse = await fetch("http://localhost:5000/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@gmail.com",
        password: "admin123"
      }),
    });

    const adminData = await adminResponse.json();
    
    if (adminResponse.ok) {
      console.log("✅ Admin Login: SUCCESS");
      console.log(`Admin: ${adminData.admin.firstName}`);
    } else {
      console.log(`❌ Admin Login: ${adminData.message}`);
    }
  } catch (error) {
    console.log(`💥 Admin Login ERROR: ${error.message}`);
  }

  console.log("\n🎉 Basic authentication test completed!");
}

testBasicAuth();