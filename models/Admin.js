import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 5 },
  },
  { timestamps: true }
);

// Static method to create default admin
adminSchema.statics.createDefaultAdmin = async function () {
  try {
    const existingAdmin = await this.findOne({ email: "admin@gmail.com" });
    if (existingAdmin) {
      console.log("Admin account already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash("admin11", 10);
    const admin = new this({
      email: "admin@gmail.com",
      password: hashedPassword,
    });
    await admin.save();
    console.log("Default admin account created successfully");
  } catch (err) {
    console.error("Error creating default admin:", err);
  }
};

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;
