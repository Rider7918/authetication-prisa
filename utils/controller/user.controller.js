import crypto from "crypto";
import nodemailer from "nodemailer";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken'


const prisma = new PrismaClient()
//register new user
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "all fields are empty",
    });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where:{email}
    })
    if (existingUser) {
      return res.status(400).json({
        message: "user already exsists",
      });
    }

    // hash the password

    const hashedPassword = await bcrypt.hash(password,10)
    const token = crypto.randomBytes(32).toString("hex");

    const user = await prisma.user.create({
      data:{
        name,
        email,
        password:hashedPassword,
        verificationToken:token
      }
    });
    console.log(user);

    if (!user) {
      return res.status(400).json({
        message: "user not registeted",
      });
    }
   

    var transport = nodemailer.createTransport({
      host: process.env.MAILTRAP_HO,
      port: process.env.MAILTRAP_PORT,
      auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    });

    const mailOption = {
      from: process.env.MAILTRAP_SENDERMAIL, // sender address
      to: user.email, // list of receivers
      subject: "Verify Your Email ✔", // Subject line
      text: `Please click on the following link:
              ${process.env.BASE_URL}/api/v1/user/verify/${token}
              `,
    };

    await transport.sendMail(mailOption)

    res.status(200).json({
      message: "user is registered",
    });
  } catch (error) {
    return res.status(400).json({
      message: "something happened",
    });
  }
};



// verify user

const verifyUser = async (req, res) =>{
  const {token} = req.params
  console.log(token)

  if(!token){
    return res.status(400).json({
      message: "token not found"
    })
  }

  try{
    const isValidToken = await prisma.user.findFirst({
      where:{
        verificationToken:token
      }
    })

    console.log("token is",isValidToken)

    if(!isValidToken){
      return res.status(400).json({
        message:"invalid token "
      })
    }
    
    await prisma.user.updateMany({
      where:{
        verificationToken:token
      },
      data:{
        isVerified:true,
        verificationToken:null
      }
    })

    res.status(200).json({
      success:true,
      message:"user verified"
    })
  }catch(error){
    return res.status(400).json({
      message:"invalid token: something went wrong"
    })
  }
}

const login = async (req,res) =>{
  const {email, password} =  req.body

  if(!email || !password){
    return res.status(400).json({
      message: "all fields are required"
    })
  }

  try {

    const user = await prisma.user.findUnique({
      where:{
        email
      }
    })

    //console.log("user",user)

    if(!user){
      return res.status(400).json({
        message:"invalid email or password"
      })
    }

    const isMatch =  await bcrypt.compare(password,user.password)

    console.log(isMatch)

    if(!isMatch){
      return res.status(400).json({
        message:"invalid password"
      })
    }

    console.log(user)
    const token = jwt.sign({id: user.id}, process.env.JWT_SECRET,{
      expiresIn: "24h"
    })

    console.log(token)

    const cookieOptions ={
      httpOnly: true,
      secure: true,
      maxAge: 24*60*60*1000
    }

    res.cookie("token",token,cookieOptions)

    res.status(201).json({
      success:true,
      message:"Login successful",
      user:{
        id:user._id,
        name:user.name,
        role:user.role
      }
    })
    
  } catch (error) {
    return res.status(400).json({
      message:"somthing went wrong"
    })
  }
}

const getMe = async(req, res) =>{
  try {
    const user = await prisma.user.findFirst({
      where:{
        id: req.user.id,
      }
    })

    console.log(user)

    if(!user){
      return res.status(400).json({
        message:"User not found",
        success:false
      })
    }

    res.status(200).json({
      success:true,
      user:{
        id:user.id,
        email:user.email,
        name:user.name
      }
    })
  } catch (error) {
    console.log("authetication failure")
    return res.status(500).json({
        success:false,
        message:"Internal server error"
    })
  }
}

const logoutUser  = async(req,res) =>{
  try {
    res.cookie("token","",{
      
    })
    res.status(200).json({
      success:true,
      message:"Logged out successfully"
     })
  } catch (error) {
    res.status(400).json({
      success:true,
      message:"error logging out"
     })
  }
}

export { registerUser, verifyUser, login, getMe, logoutUser };
