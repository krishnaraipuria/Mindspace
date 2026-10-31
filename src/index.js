import dotenv from "dotenv"
import connectdb from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: './env'
})

import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

connectdb()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running at port :${process.env.PORT}`)
    })
    app.on("error",(error)=>{
        console.log("ERRR:",error);
        throw error
    })
})
.catch((err)=>{
    console.log("MONGO db connection failed!!",err)
})