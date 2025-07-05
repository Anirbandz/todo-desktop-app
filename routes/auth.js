const express = require("express")
const router = express.Router()
const passport = require('passport')
const bcrypt = require('bcryptjs')
const User = require('../models/User')

// Login page
router.get("/login", (req, res) => {
  res.render("auth/login", {
    title: "Login - TaskFlow",
    page: "login",
  })
})

// Signup page
router.get("/signup", (req, res) => {
  res.render("auth/signup", {
    title: "Sign Up - TaskFlow",
    page: "signup",
  })
})

// Login form submission
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body
    
    if (!email || !password) {
      return res.render("auth/login", {
        title: "Login - TaskFlow",
        page: "login",
        error: "Please provide both email and password"
      })
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() })
    
    if (!user) {
      return res.render("auth/login", {
        title: "Login - TaskFlow",
        page: "login",
        error: "Invalid email or password"
      })
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password)
    
    if (!isMatch) {
      return res.render("auth/login", {
        title: "Login - TaskFlow",
        page: "login",
        error: "Invalid email or password"
      })
    }

    // Log in user
    req.login(user, (err) => {
      if (err) {
        console.error("Login error:", err)
        return res.render("auth/login", {
          title: "Login - TaskFlow",
          page: "login",
          error: "Login failed. Please try again."
        })
      }
      res.redirect('/dashboard')
    })
  } catch (error) {
    console.error("Login error:", error)
    res.render("auth/login", {
      title: "Login - TaskFlow",
      page: "login",
      error: "Login failed. Please try again."
    })
  }
})

// Signup form submission
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body
    
    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return res.render("auth/signup", {
        title: "Sign Up - TaskFlow",
        page: "signup",
        error: "Please fill in all fields"
      })
    }

    if (password !== confirmPassword) {
      return res.render("auth/signup", {
        title: "Sign Up - TaskFlow",
        page: "signup",
        error: "Passwords do not match"
      })
    }

    if (password.length < 6) {
      return res.render("auth/signup", {
        title: "Sign Up - TaskFlow",
        page: "signup",
        error: "Password must be at least 6 characters long"
      })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    
    if (existingUser) {
      return res.render("auth/signup", {
        title: "Sign Up - TaskFlow",
        page: "signup",
        error: "User with this email already exists"
      })
    }

    // Hash password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create new user
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      googleId: null,
      profilePic: null,
      theme: 'light'
    })

    await newUser.save()

    // Log in the new user
    req.login(newUser, (err) => {
      if (err) {
        console.error("Auto-login error:", err)
        return res.redirect('/auth/login')
      }
      res.redirect('/dashboard')
    })
  } catch (error) {
    console.error("Signup error:", error)
    res.render("auth/signup", {
      title: "Sign Up - TaskFlow",
      page: "signup",
      error: "Registration failed. Please try again."
    })
  }
})

// Logout route
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err)
    }
    res.redirect("/")
  })
})

module.exports = router
