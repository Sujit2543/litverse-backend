// Test email validation
async function testEmailValidation() {
  const testEmails = [
    "valid@gmail.com",
    "test@yahoo.com", 
    "user@outlook.com",
    "invalid@fakeemail.com",
    "notanemail",
    "test@test.test",
    "student@university.edu",
    "admin@government.gov"
  ];

  console.log("🧪 Testing Email Validation:");
  console.log("=" .repeat(50));

  for (const email of testEmails) {
    try {
      const response = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: "Test",
          lastName: "User",
          email: email,
          password: "Password123!"
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ ${email} - ACCEPTED`);
      } else {
        console.log(`❌ ${email} - REJECTED: ${data.message}`);
      }
    } catch (error) {
      console.log(`💥 ${email} - ERROR: ${error.message}`);
    }
  }
}

testEmailValidation();