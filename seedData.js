import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

// Import models
import User from "./models/User.js";
import Book from "./models/Book.js";
import MockTest from "./models/MockTest.js";
import Purchase from "./models/Purchase.js";

dotenv.config();

const sampleBooks = [
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    description: "A classic American novel set in the Jazz Age, exploring themes of wealth, love, and the American Dream.",
    category: "Fiction",
    price: 12.99,
    originalPrice: 15.99,
    coverImage: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop",
    isbn: "978-0-7432-7356-5",
    pages: 180,
    language: "English",
    publisher: "Scribner",
    tags: ["classic", "american literature", "jazz age"],
    isFeatured: true
  },
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    description: "A gripping tale of racial injustice and childhood innocence in the American South.",
    category: "Fiction",
    price: 13.99,
    originalPrice: 16.99,
    coverImage: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop",
    isbn: "978-0-06-112008-4",
    pages: 324,
    language: "English",
    publisher: "J.B. Lippincott & Co.",
    tags: ["classic", "social justice", "coming of age"],
    isFeatured: true
  },
  {
    title: "Clean Code",
    author: "Robert C. Martin",
    description: "A handbook of agile software craftsmanship with practical advice for writing clean, maintainable code.",
    category: "Technology",
    price: 29.99,
    originalPrice: 39.99,
    coverImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=400&fit=crop",
    isbn: "978-0-13-235088-4",
    pages: 464,
    language: "English",
    publisher: "Prentice Hall",
    tags: ["programming", "software development", "best practices"]
  },
  {
    title: "The Psychology of Money",
    author: "Morgan Housel",
    description: "Timeless lessons on wealth, greed, and happiness from one of the most important financial writers.",
    category: "Business",
    price: 18.99,
    originalPrice: 22.99,
    coverImage: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&h=400&fit=crop",
    isbn: "978-0-85719-996-8",
    pages: 256,
    language: "English",
    publisher: "Harriman House",
    tags: ["finance", "psychology", "investing"]
  },
  {
    title: "Sapiens",
    author: "Yuval Noah Harari",
    description: "A brief history of humankind, exploring how Homo sapiens came to dominate the world.",
    category: "History",
    price: 16.99,
    originalPrice: 19.99,
    coverImage: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop",
    isbn: "978-0-06-231609-7",
    pages: 443,
    language: "English",
    publisher: "Harper",
    tags: ["history", "anthropology", "evolution"]
  }
];

const sampleUsers = [
  {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@gmail.com",
    password: "Password123!"
  },
  {
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@gmail.com",
    password: "Password123!"
  },
  {
    firstName: "Mike",
    lastName: "Johnson",
    email: "mike.johnson@yahoo.com",
    password: "Password123!"
  },
  {
    firstName: "Sarah",
    lastName: "Wilson",
    email: "sarah.wilson@outlook.com",
    password: "Password123!"
  },
  {
    firstName: "Alex",
    lastName: "Brown",
    email: "alex.brown@hotmail.com",
    password: "Password123!"
  }
];

const sampleMockTests = [
  {
    title: "JavaScript Fundamentals Quiz",
    description: "Test your knowledge of JavaScript basics including variables, functions, and DOM manipulation.",
    category: "Programming",
    duration: 30,
    totalQuestions: 20,
    totalMarks: 100,
    passingMarks: 60,
    difficulty: "beginner",
    isFree: true,
    questions: [
      {
        question: "What is the correct way to declare a variable in JavaScript?",
        options: ["var myVar;", "variable myVar;", "v myVar;", "declare myVar;"],
        correctAnswer: 0,
        explanation: "The 'var' keyword is used to declare variables in JavaScript.",
        difficulty: "easy",
        points: 5
      },
      {
        question: "Which method is used to add an element to the end of an array?",
        options: ["push()", "add()", "append()", "insert()"],
        correctAnswer: 0,
        explanation: "The push() method adds one or more elements to the end of an array.",
        difficulty: "easy",
        points: 5
      }
    ]
  },
  {
    title: "General Knowledge Challenge",
    description: "A comprehensive test covering various topics including history, science, and current affairs.",
    category: "General Knowledge",
    duration: 45,
    totalQuestions: 30,
    totalMarks: 150,
    passingMarks: 90,
    difficulty: "intermediate",
    isFree: false,
    price: 9.99,
    questions: [
      {
        question: "What is the capital of Australia?",
        options: ["Sydney", "Melbourne", "Canberra", "Perth"],
        correctAnswer: 2,
        explanation: "Canberra is the capital city of Australia.",
        difficulty: "medium",
        points: 5
      }
    ]
  }
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await Book.deleteMany({});
    await MockTest.deleteMany({});
    await Purchase.deleteMany({});
    console.log("🗑️ Cleared existing data");

    // Create users
    const hashedUsers = await Promise.all(
      sampleUsers.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 10)
      }))
    );
    const createdUsers = await User.insertMany(hashedUsers);
    console.log(`👥 Created ${createdUsers.length} users`);

    // Create books
    const createdBooks = await Book.insertMany(sampleBooks);
    console.log(`📚 Created ${createdBooks.length} books`);

    // Create admin for mock tests
    const adminSchema = new mongoose.Schema({
      firstName: { type: String, required: true },
      lastName: { type: String },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      role: { type: String, default: "admin" },
      createdAt: { type: Date, default: Date.now },
    });
    const Admin = mongoose.model("Admin", adminSchema);
    
    let admin = await Admin.findOne({ email: "admin@gmail.com" });
    if (!admin) {
      admin = await Admin.create({
        firstName: "Admin",
        lastName: "User",
        email: "admin@gmail.com",
        password: await bcrypt.hash("admin123", 10)
      });
    }

    // Create mock tests
    const testsWithAdmin = sampleMockTests.map(test => ({
      ...test,
      createdBy: admin._id
    }));
    const createdTests = await MockTest.insertMany(testsWithAdmin);
    console.log(`📝 Created ${createdTests.length} mock tests`);

    // Create sample purchases
    const samplePurchases = [
      {
        userId: createdUsers[0]._id,
        bookId: createdBooks[0]._id,
        amount: createdBooks[0].price,
        paymentMethod: "card",
        paymentStatus: "completed",
        transactionId: "TXN001"
      },
      {
        userId: createdUsers[1]._id,
        bookId: createdBooks[1]._id,
        amount: createdBooks[1].price,
        paymentMethod: "paypal",
        paymentStatus: "completed",
        transactionId: "TXN002"
      },
      {
        userId: createdUsers[2]._id,
        bookId: createdBooks[2]._id,
        amount: createdBooks[2].price,
        paymentMethod: "card",
        paymentStatus: "pending",
        transactionId: "TXN003"
      }
    ];
    const createdPurchases = await Purchase.insertMany(samplePurchases);
    console.log(`💰 Created ${createdPurchases.length} purchases`);

    console.log("🎉 Database seeded successfully!");
    console.log("\n📋 Sample Credentials:");
    console.log("Admin: admin@gmail.com / admin123");
    console.log("Users can login with:");
    console.log("- john.doe@gmail.com / Password123!");
    console.log("- jane.smith@gmail.com / Password123!");
    console.log("- mike.johnson@yahoo.com / Password123!");
    console.log("- sarah.wilson@outlook.com / Password123!");
    console.log("- alex.brown@hotmail.com / Password123!");
    console.log("\nOr register with any real email address!");
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase();