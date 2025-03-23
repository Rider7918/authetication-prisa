import jwt from 'jsonwebtoken'

export const isLoggedIn = async(req,res, next) =>{
    try {
        console.log(req.cookies)
        let token = req.cookies.token || ""

        console.log("token found:", token? "Yes" : "No")

        if(!token){
            console.log("No token")
            return res.status(401).json({
                success: false,
                message:"Authetication Failed"
            })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        console.log("decoded data",decoded)

        req.user = decoded

        next()

    } catch (error) {
        console.log("authetication failure")
        return res.status(500).json({
            success:false,
            message:"Internal server error middleware"
        })
    }
}