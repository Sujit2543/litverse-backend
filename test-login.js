// Test admin login API
async function testAdminLogin() {
  try {
    const response = await fetch("http://localhost:5000/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email: "admin@gmail.com", 
        password: "admin123" 
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log("✅ Admin login successful!");
      console.log("Response:", data);
    } else {
      console.log("❌ Admin login failed!");
      console.log("Error:", data);
    }
  } catch (error) {
    console.error("❌ Network error:", error);
  }
}

testAdminLogin();