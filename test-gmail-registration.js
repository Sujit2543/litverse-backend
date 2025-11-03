// Test Gmail registration
async function testGmailRegistration() {
  console.log("📧 Testing Gmail Registration:");
  console.log("=" .repeat(50));

  // Test 1: Gmail Email & Password Registration
  try {
    console.log("1. Testing Gmail Email & Password Registration...");
    const response = await fetch("http://localhost:5000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe.test@gmail.com",
        password: "MyPassword123!"
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log("✅ Gmail Registration: SUCCESS");
    } else {
      console.log(`❌ Gmail Registration: ${data.message}`);
    }
  } catch (error) {
    console.log(`💥 Gmail Registration ERROR: ${error.message}`);
  }

  // Test 2: Gmail OTP Registration
  try {
    console.log("\n2. Testing Gmail OTP Registration...");
    const response = await fetch("http://localhost:5000/auth/email/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "jane.doe.test@gmail.com"
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log("✅ Gmail OTP: SUCCESS");
      if (data.otp) {
        console.log(`📧 Demo OTP for Gmail: ${data.otp}`);
      }
    } else {
      console.log(`❌ Gmail OTP: ${data.message}`);
    }
  } catch (error) {
    console.log(`💥 Gmail OTP ERROR: ${error.message}`);
  }

  // Test 3: Invalid Email Rejection
  try {
    console.log("\n3. Testing Invalid Email Rejection...");
    const response = await fetch("http://localhost:5000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Test",
        lastName: "User",
        email: "invalid@fakeemail.com",
        password: "Password123!"
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log("❌ Should have rejected fake email");
    } else {
      console.log(`✅ Correctly rejected fake email: ${data.message}`);
    }
  } catch (error) {
    console.log(`💥 Validation ERROR: ${error.message}`);
  }

  console.log("\n🎉 Gmail registration test completed!");
  console.log("\n📋 Next Steps:");
  console.log("1. Open: http://localhost:5175");
  console.log("2. Click: Register button");
  console.log("3. Choose: Email method");
  console.log("4. Enter: your-real-email@gmail.com");
  console.log("5. Create: Strong password");
  console.log("6. Success: Account created!");
}

testGmailRegistration();