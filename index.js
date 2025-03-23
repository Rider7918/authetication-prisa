import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import userRoutes from './utils/routes/user.route.js'
import cookieParser from 'cookie-parser'

const port = process.env.PORT || 3000
const app = express()




dotenv.config()

app.use(cors({
    origin:"http://localhost:3000",
    credentials:true,
    method:['GET','POST','DELETE','OPTIONS'],
    allowedHeaders:['Content-Type','Authorization']
}))    

app.use(express.json())
app.use(express.urlencoded({extended:4000}))
app.use(cookieParser())


app.use("/api/v1/user",userRoutes)




app.listen(port,()=>{
    console.log("listenign to port 3000")
})