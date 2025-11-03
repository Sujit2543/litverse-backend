// Test mandatory OTP registration system
async function testMandatoryOTP() {
  console.log("🔐 Testing Mandatory OTP Registration System:");
  console.log("=" .repeat(60));

  // Test 1: Try old registration endpoint (should be blocked)
  try {
    console.log("1. Testing Old Registration Endpoint (Should be blocked)...");
    const response = await fetch("http://localhost:5000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Test",
        lastName: "User",
        email: "test@anydomain.com",
        password: "Password123!"
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log("❌ Old endpoint should be blocked");
    } else {
      console.log(`✅ Old endpoint correctly blocked: ${data.message}`);
    }
  } catch (error) {
    console.log(`💥 Old endpoint ERROR: ${error.message}`);
  }

  // Test 2: Send OTP for registration
  try {
    console.log("\n2. Testing Send OTP for Registration...");
    const response = await fetch("http://localhost:5000/register/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@anydomain.com",
        password: "MySecurePass123!"
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log("✅ OTP Send: SUCCESS");
      if (data.otp) {
        console.log(`📧 Demo OTP: ${data.otp}`);
        
        // Test 3: Verify OTP and complete registration
        console.log("\n3. Testing OTP Verification...");
        const verifyResponse = await fetch("http://localhost:5000/register/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "john.doe@anydomain.com",
            otp: data.otp
          }),
        });

        const verifyData = await verifyResponse.json();
        
        if (verifyResponse.ok) {
          console.log("✅ OTP Verification: SUCCESS");
          console.log(`👤 User Created: ${verifyData.user.firstName} ${verifyData.user.lastName}`);
          console.log(`📧 Email: ${verifyData.user.email}`);
          console.log(`🔑 Token: ${verifyData.token.substring(0, 20)}...`);
        } else {
          console.log(`❌ OTP Verification: ${verifyData.message}`);
        }
      }
    } else {
      console.log(`❌ OTP Send: ${data.message}`);
    }
  } catch (error) {
    console.log(`💥 OTP Send ERROR: ${error.message}`);
  }

  // Test 4: Test with any domain email
  try {
    console.log("\n4. Testing Any Domain Email (company@example.org)...");
    const response = await fetch("http://localhost:5000/register/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@company.org",
        password: "SecurePassword456!"
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log("✅ Any Domain Email: ACCEPTED");
      if (data.otp) {
        console.log(`📧 Demo OTP for company email: ${data.otp}`);
      }
    } else {
      console.log(`❌ Any Domain Email: ${data.message}`);
    }
  } catch (error) {
    console.log(`💥 Any Domain Email ERROR: ${error.message}`);
  }

  // Test 5: Test invalid OTP
  try {
    console.log("\n5. Testing Invalid OTP...");
    const response = await fetch("http://localhost:5000/register/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        otp: "000000"
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log("❌ Invalid OTP should be rejected");
    } else {
      console.log(`✅ Invalid OTP correctly rejected: ${data.message}`);
    }
  } catch (error) {
    console.log(`💥 Invalid OTP ERROR: ${error.message}`);
  }

  console.log("\n🎉 Mandatory OTP registration test completed!");
  console.log("\n📋 New Registration Flow:");
  console.log("1. User enters: Name, Email (any domain), Password");
  console.log("2. System sends: OTP to their email address");
  console.log("3. User verifies: 6-digit OTP code");
  console.log("4. Account created: Only after email verification");
  console.log("5. Auto login: User gets JWT token immediately");
}

testMandatoryOTP();