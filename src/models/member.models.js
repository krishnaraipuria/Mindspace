import mongoose, { Schema } from "mongoose"

const memberSchema=new Schema(
    {
        username:{
            type:String,
            required:true,
            trim:true
        },
        roomId:{
            type:Schema.Types.ObjectId,
            ref:"Room",
            required:true
        },
        socketId:{
            type:String,
            required:true,
            unique:true
        },
        role:{
            type:String,
            enum:["admin","member"],
            default:"member"
        }
    },{timestamps:true}
)

memberSchema.index({roomId:1});

export const Member=mongoose.model("Member",memberSchema)