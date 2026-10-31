import mongoose, { Schema } from "mongoose"

const roomSchema=new Schema(
    {
        roomId:{
            type:String,
            required:true,
            unique:true,
            index:true
        },
        elements:{
            type:[mongoose.Schema.Types.Mixed],
            default:[]
        },

        isSaved:{
            type:Boolean,
            default:false
        },

        savedKey:{
            type:String,
            unique:true,
            sparse:true,
        }
    },{timestamps:true}
)

export const Room=mongoose.model("Room",roomSchema)