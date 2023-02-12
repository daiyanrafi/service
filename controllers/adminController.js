const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const { render } = require("../routers/userRoute");
const rendomString = require("randomstring");
const nodemailer = require("nodemailer");

const config = require("../config/config");

//for reset password saved save password
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log("Error");
  }
};

//for send mail
const sendResetPasswordMail = async (name, email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: config.emailUser,
        pass: config.emailPassword,
      },
    });

    const mailOptions = {
      from: config.emailUser,
      to: email,
      subject: "For reset password",
      html:
        "<p>Hi " +
        name +
        ', please click <a href="http://localhost:3000/admin/forget-password?token=' +
        token +
        '"> Reset </a> your password.  </p>',
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

//for admin login
const loadLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        if (userData.is_admin === 0) {
          res.render("login", { message: "You are not admin" });
        } else {
          req.session.user_id = userData._id;
          res.redirect("/admin/home");
      
        }
      } else {
        res.render("login", { message: "Wrong...!" });
      } /////////
    } else {
      res.render("login", { message: "Successfull" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//for admin dashboard
const loadDashboard = async (req, res) => {
  try {
  const userData = await User.findById({_id: req.session.user_id});
    res.render("home", {admin: userData});
  } catch (error) {
    console.log(error.message);
  }
};

//for logout
const logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};

//for forget password
const forgetLoad = async (req, res) => {
  try {
    res.render("forget");
  } catch (error) {
    console.log(error.message);
  }
};

//forget password verify
const forgetVerify = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });
    if (userData) {
      if (userData.is_admin === 0) {
        res.render("forget", { message: "Invalid email" });
      } else {
        const randomstring = rendomString.generate(7);
        const updateData = await User.updateOne(
          { email: email },
          { $set: { token: randomstring } }
        );
        sendResetPasswordMail(userData.name, userData.email, randomstring);
        res.render("forget", { message: "Please check your email" });
      }
    } else {
      res.render("forget", { message: "Invalid email" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//for forget password load
const forgetPasswordLoad = async (req, res) => {
  try {
    const token = req.query.token;
    const tokenData = User.findOne({ token: token });
    if (tokenData) {
      res.render("forget-password", { user_id: tokenData._id });
    } else {
      res.render("404", { message: "Invalid link" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//for reset password
const resetPassword = async (req, res) => {
  try {
    const password = req.body.password;
    const user_id = req.body.user_id;

    const securePass = await securePassword(password);
    const updateData = await User.findByIdAndUpdate(
      { _id: user_id },
      { $set: { password: securePass, token: "" } }
    );

    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};

//for dashboard
const adminDashboard = async (req, res) => {
  try {
   const usersData = await User.find({is_admin:0})
    res.render("dashboard",{users:usersData});
  } catch (error) {
    console.log(error.message);
  }
};


module.exports = {
  loadLogin,
  verifyLogin,
  loadDashboard,
  logout,
  forgetLoad,
  forgetVerify,
  forgetPasswordLoad,
  resetPassword,
  adminDashboard,

};
