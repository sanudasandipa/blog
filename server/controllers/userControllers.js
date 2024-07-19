const User = require('../models/userModel');
const HttpError = require('../models/errorModel');
const fs = require('fs');
const path = require('path');
const { v4: uuid } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ================== REGISTER A NEW USER
// POST : api/users/register
// UNPROTECTED
const registerUser = async (req, res, next) => {
  const { name, email, password, password2 } = req.body;

  // Check if all required fields are provided
  if (!name || !email || !password || !password2) {
    return next(new HttpError('Please fill in all fields', 422));
  }

  // Normalize email to lowercase
  const normalizedEmail = email.toLowerCase();

  // Check if email already exists in the database
  const emailExists = await User.findOne({ email: normalizedEmail });
  if (emailExists) {
    return next(new HttpError('Email already exists', 422));
  }

  // Validate password length
  if (password.trim().length < 6) {
    return next(new HttpError('Password should be at least 6 characters', 422));
  }

  // Check if passwords match
  if (password !== password2) {
    return next(new HttpError('Passwords do not match', 422));
  }

  try {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user in the database
    const newUser = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
    });

    // Respond with the newly created user object
    res.status(201).json(`New user ${newUser.email} registered`);
  } catch (error) {
    // Handle any errors that occur during registration
    console.error('User registration failed:', error);
    return next(new HttpError('User registration failed', 500));
  }
};

// ==================LOGIN A REGISTER USER
// POST : api/users/login
// UNPROTECTED
const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new HttpError('Fill in all fields', 422));
  }

  const normalizedEmail = email.toLowerCase();

  try {
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return next(new HttpError('Invalid credentials', 422));
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return next(new HttpError('Invalid credentials', 422));
    }

    const { _id: id, name } = user;
    const token = jwt.sign({ id, name }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.status(200).json({ token, id, name });
  } catch (error) {
    console.error('Login failed:', error);
    return next(new HttpError('Login failed. Please check your credentials', 500));
  }
};

// ================== USER PROFILE
// GET : api/users/:id
// PROTECTED
const getUser = async (req, res, next) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).select('-password');
    if (!user) {
      return next(new HttpError('User not found', 404));
    }

    res.json({ user });
  } catch (error) {
    console.error('Error in getUser:', error);
    return next(new HttpError('Could not fetch user', 500));
  }
};

// ================== CHANGE USER AVATAR (profile picture)
// POST : api/users/change-avatar
// PROTECTED
const changeAvatar = async (req, res, next) => {
  if (!req.files || !req.files.avatar) {
    return next(new HttpError('Please choose an image', 422));
  }

  const { avatar } = req.files;

  // Check file size
  if (avatar.size > 500000) {
    return next(new HttpError('Profile picture too big. Should be less than 500KB', 422));
  }

  try {
    const user = await User.findById(req.user.id);

    // Delete old avatar if exists
    if (user.avatar) {
      fs.unlink(path.join(__dirname, '..', 'uploads', user.avatar), (err) => {
        if (err) {
          console.error('Error deleting old avatar:', err);
        }
      });
    }

    const fileExtension = path.extname(avatar.name);
    const newFilename = `${uuid()}${fileExtension}`;

    avatar.mv(path.join(__dirname, '..', 'uploads', newFilename), async (err) => {
      if (err) {
        return next(new HttpError('Failed to upload avatar', 500));
      }

      user.avatar = newFilename;
      await user.save();

      res.status(200).json({ avatar: newFilename });
    });
  } catch (error) {
    console.error('Error in changeAvatar:', error);
    return next(new HttpError('Avatar change failed', 500));
  }
};

// ================== EDIT USER DETAILS (from profile)
// PATCH : api/users/edit-user
// PROTECTED
const editUser = async (req, res, next) => {
  const { name, email, currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!name || !email || !currentPassword || !newPassword || !confirmNewPassword) {
    return next(new HttpError('Fill in all fields', 422));
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new HttpError('User not found', 404));
    }

    const emailExists = await User.findOne({ email });
    if (emailExists && emailExists._id.toString() !== req.user.id) {
      return next(new HttpError('Email already exists', 422));
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return next(new HttpError('Invalid current password', 422));
    }

    if (newPassword !== confirmNewPassword) {
      return next(new HttpError('New passwords do not match', 422));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.name = name;
    user.email = email;
    user.password = hashedPassword;
    await user.save();

    res.status(200).json(user);
  } catch (error) {
    console.error('Error in editUser:', error);
    return next(new HttpError('User update failed', 500));
  }
};

// ================== GET AUTHORS
// GET : api/users/authors
// UNPROTECTED
const getAuthors = async (req, res, next) => {
  try {
    const authors = await User.find().select('-password');
    res.json(authors);
  } catch (error) {
    console.error('Error in getAuthors:', error);
    return next(new HttpError('Could not fetch authors', 500));
  }
};

module.exports = { registerUser, loginUser, getUser, changeAvatar, editUser, getAuthors };
