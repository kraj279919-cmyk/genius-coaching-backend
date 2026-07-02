const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the User schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      unique: true, // No duplicate emails allowed
      sparse: true, // Allows multiple null/undefined values
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6, // Passwords must be at least 6 characters
    },
    role: {},
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived', 'deleted'],
      default: 'active',
    },
    profileImage: {
      type: String,
      default: 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg', // Default avatar
    },
  },
  {
    timestamps: true, // Automatically creates createdAt and updatedAt fields
  }
);

// Encrypt password before saving to the database
userSchema.pre('save', async function () {
  // If the password field hasn't been modified, skip hashing
  if (!this.isModified('password')) {
    return;
  }

  // Hash the password with bcrypt
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to check if entered password matches the hashed password in the database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Create and export the User model
const User = mongoose.model('User', userSchema);

module.exports = User;
