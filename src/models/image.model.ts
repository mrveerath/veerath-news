import mongoose, { models, Schema } from "mongoose"

interface AImage {
    url: string
    fileId: string
    uploadedAt: Date
    originalName: string
    mimeType: string
    uploadedBy:string
}

const ImageSchema = new Schema<AImage>({
  url: {
    type: String,
    required: true
  },
  fileId: {
    type: String,
    required: true,
    unique: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: String,
    required: true
  }
});

export const Image = models.Image || mongoose.model('Image', ImageSchema);