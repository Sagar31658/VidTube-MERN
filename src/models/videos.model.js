import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videosSchema = new Schema(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        title:{
            type:String,
            required:true
        },
        description:{
            type:String
        },
        thumbnail:{
            type:String,
            required:true
        },
        videoFile:{
            type:String,
            required:true
        },
        duration:{
            type:Number,
            required:true
        },
        views:{
            type:Number,
            default: 0
        },
        isPublished:{
            type:Boolean,
            default: true
        }

    },
    {
        timestamps: true
    }
)

export const Video = mongoose.model("Video", videosSchema)