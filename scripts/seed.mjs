import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Make sure these paths correctly point to your compiled schema files
import { User } from "../models/userSchema.mjs";
import { Project } from "../models/projectSchema.mjs";

const seedDatabase = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined.");
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB!");

    console.log("🧹 Clearing existing users and projects...");
    await User.deleteMany({});
    await Project.deleteMany({});

    // Define a simple plaintext password
    const plainPassword = "password123";

    // Create sample USERS with plaintext passwords
    const sampleUsers = [
      {
        fullName: "Alice Johnson",
        email: "alice@example.com",
        password: plainPassword,
        skills: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
      },
      {
        fullName: "Bob Williams",
        email: "bob@example.com",
        password: plainPassword,
        skills: ["Node.js", "Express", "MongoDB", "Docker"],
      },
      {
        fullName: "Charlie Brown",
        email: "charlie@example.com",
        password: plainPassword,
        skills: ["Python", "TensorFlow", "PyTorch", "scikit-learn"],
      },
    ];

    console.log("👤 Inserting users...");
    const createdUsers = await User.insertMany(sampleUsers);
    console.log(`   ${createdUsers.length} users created successfully.`);

    // Create sample PROJECTS linked to the new users
    const sampleProjects = [
      {
        title: "Interactive Data Viz Dashboard",
        description: "A web app for creating and sharing dynamic charts.",
        requiredSkills: ["React", "D3.js", "Python", "Flask"],
        membersRequired: 3,
        type: "collaboration",
      },
      {
        title: "Real-time Collaborative Whiteboard",
        description: "Building a Trello-like board with real-time updates.",
        requiredSkills: ["Next.js", "Socket.IO", "MongoDB"],
        membersRequired: 4,
        type: "hackathon",
      },
    ];

    console.log("🚀 Assigning creators and inserting projects...");
    const projectsToCreate = sampleProjects.map((project) => {
      const randomCreator =
        createdUsers[Math.floor(Math.random() * createdUsers.length)];
      return {
        ...project,
        creator: randomCreator._id,
        members: [randomCreator._id], // Add the creator as the first member
      };
    });

    const createdProjects = await Project.insertMany(projectsToCreate);
    console.log(`   ${createdProjects.length} projects created successfully.`);

    console.log("\n✅ Database seeded successfully! 🌱");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    mongoose.connection.close();
    console.log("🔌 Connection closed.");
  }
};

seedDatabase();
