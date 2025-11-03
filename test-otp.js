// Test OTP functionality
async function testOTP() {
  console.log("🧪 Testing OTP Functionality:");
  console.log("=" .repeat(50));

  // Test 1: Send Email OTP
  try {
    console.log("1. Testing Email OTP...");
    const emailOTPResponse = await fetch("http://localhost:5000/auth/email/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "newtestuser@gmail.com"
      }),
    });

    const emailOTPData = await emailOTPResponse.json();
    
    if (emailOTPResponse.ok) {
      console.log("✅ Email OTP: SUCCESS");
      if (emailOTPData.otp) {
        console.log(`📧 Demo OTP: ${emailOTPData.otp}`);
      }
    } else {
      console.log(`❌ Email OTP: ${emailOTPData.message}`);
    }
  } catch (error) {
    console.log(`💥 Email OTP ERROR: ${error.message}`);
  }

  // Test 2: Send Mobile OTP
  try {
    console.log("\n2. Testing Mobile OTP...");
    const mobileOTPResponse = await fetch("http://localhost:5000/auth/mobile/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumber: "+1234567890"
      }),
    });

    const mobileOTPData = await mobileOTPResponse.json();
    
    if (mobileOTPResponse.ok) {
      console.log("✅ Mobile OTP: SUCCESS");
      if (mobileOTPData.otp) {
        console.log(`📱 Demo OTP: ${mobileOTPData.otp}`);
      }
    } else {
      console.log(`❌ Mobile OTP: ${mobileOTPData.message}`);
    }
  } catch (error) {
    console.log(`💥 Mobile OTP ERROR: ${error.message}`);
  }

  console.log("\n🎉 OTP functionality test completed!");
}

testOTP();