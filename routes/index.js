const express = require("express")
const router = express.Router()

// Homepage
router.get("/", (req, res) => {
  res.render("index", {
    title: "TaskFlow - Desktop Todo App",
    user: req.user
  })
})

module.exports = router
