'use server';

import { dbConnect } from '@/lib/dbConnect';
import { Image } from '@/models/image.model';
import ImageKit from 'imagekit';
import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGE_KIT_PUBLIC_API_KEY || '',
  privateKey: process.env.IMAGE_KIT_PRIVATE_API_KEY || '',
  urlEndpoint: process.env.IMAGE_KIT_URL_ENDPOINT || '',
});


// Type definitions
// Type definitions
export interface ImageType {
  _id: string;
  url: string;
  fileId: string;
  uploadedAt: Date;
  originalName: string;
  mimeType: string;
  uploadedBy: string;
}

interface UploadParams {
  files: File[];
  userId: string;
}

interface GetParams {
  userId: string;
}

interface DeleteParams {
  imageId: string;
  userId: string;
}

interface UploadResult {
  success: boolean;
  images: ImageType[] | string;
}

interface GetResult {
  success: boolean;
  images: ImageType[] | string;
}

interface DeleteResult {
  success: boolean;
  error?: string;
}

/**
 * Uploads images to ImageKit and saves metadata to database
 */
export const uploadAndSaveImages = async ({
  files,
  userId
}: UploadParams): Promise<UploadResult> => {
  if (!userId || !files?.length) {
    return {
      success: false,
      images: 'Missing user ID or files for upload'
    };
  }

  try {
    await dbConnect();
    const savedImages: ImageType[] = [];
    const userIdObj = new Types.ObjectId(userId);

    // Process each file sequentially
    for (const file of files) {
      try {
        // Validate file
        if (!file.type.startsWith('image/')) {
          console.warn(`Skipping non-image file: ${file.name}`);
          continue;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          console.warn(`File too large: ${file.name} (${file.size} bytes)`);
          continue;
        }

        // Convert file to base64
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');

        // Upload to ImageKit
        const uploadResponse = await imagekit.upload({
          file: `data:${file.type};base64,${base64}`,
          fileName: `${uuidv4()}-${file.name}`,
          folder: `/users/${userId}`,
          tags: ['user-upload']
        });

        // Save to database
        const newImage = new Image({
          url: uploadResponse.url,
          fileId: uploadResponse.fileId,
          uploadedAt: new Date(),
          originalName: file.name,
          mimeType: file.type,
          uploadedBy: userIdObj
        });

        await newImage.save();

        const uploadedImage = {
          _id: newImage?._id,
          url: newImage?.url,
          uploadedAt: new Date(newImage?.uploadedAt),
          fileId: newImage?.fileId,
          originalName: newImage?.originalName,
          mimeType: newImage?.mineType,
          uploadedBy: newImage?.uploadedBy,
        }

        savedImages.push(uploadedImage as ImageType);
      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError);
        // Continue with next file even if one fails
      }
    }

    if (savedImages.length === 0) {
      return {
        success: false,
        images: 'No valid images were uploaded'
      };
    }

    return {
      success: true,
      images: savedImages
    };
  } catch (error: unknown) {
    console.error('Error in uploadAndSaveImages:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload images';
    return {
      success: false,
      images: errorMessage
    };
  }
};

/**
 * Gets all images for a user
 */
export const getAllImages = async ({ userId }: GetParams): Promise<GetResult> => {
  try {
    if (!userId) {
      return {
        success: false,
        images: 'Missing user ID'
      };
    }

    await dbConnect();
    const userIdObj = new Types.ObjectId(userId);
    const images = await Image.find({ uploadedBy: userIdObj })
      // .select("_id url fileId uploadedAt originalName mimeType uploadedBy")
      .sort({ uploadedAt: -1 })
      .lean();
    const newImages = images.map((img) => ({
      _id: img._id,
      url: img.url,
      uploadedAt: new Date(img.uploadedAt),
      fileId: img.fileId,
      originalName: img.originalName,
      mimeType: img.mineType,
      uploadedBy: img.uploadedBy,
    }))

    return {
      success: true,
      images: newImages as ImageType[]
    };
  } catch (error: unknown) {
    console.error('Error in getAllImages:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch images';
    return {
      success: false,
      images: errorMessage
    };
  }
};

/**
 * Deletes an image from ImageKit and database
 */
export const deleteImage = async ({
  imageId,
  userId
}: DeleteParams): Promise<DeleteResult> => {
  if (!userId || !imageId) {
    return {
      success: false,
      error: 'Missing user ID or image ID'
    };
  }

  try {
    await dbConnect();
    const userIdObj = new Types.ObjectId(userId);
    const imageIdObj = new Types.ObjectId(imageId);

    // Verify image exists and belongs to user
    const image = await Image.findOne({ _id: imageIdObj, uploadedBy: userIdObj });
    if (!image) {
      return {
        success: false,
        error: 'Image not found or not authorized'
      };
    }

    // Delete from ImageKit
    await imagekit.deleteFile(image.fileId);

    // Delete from database
    await Image.deleteOne({ _id: imageIdObj });

    return {
      success: true
    };
  } catch (error: unknown) {
    console.error('Error in deleteImage:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete image';
    return {
      success: false,
      error: errorMessage
    };
  }
};
