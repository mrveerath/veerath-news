"use client";

import { Button } from "@/components/ui/button";
import Imagepkr from "@/components/UploadAssetForm";
import { Upload, User, Copy, Trash, Edit, FileImage, BookText, Settings } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { deleteImage, getAllImages, ImageType, uploadAndSaveImages } from "../actions/imagesAction";
import UpdateUserForm from "@/components/UpdateUserForm";
import ChangePasswordForm from "@/components/ChangePassword";
import { signOut } from "next-auth/react";
import axios from "axios";
import { getUserDetails, updateUserDetails, updateUserPassword, UserResponse } from "../actions/userAction";

// Optional: Set Axios base URL
axios.defaults.baseURL = "/api";

export default function ProfilePage(): React.ReactElement {
  const { data } = useSession();
  const [showImageUploadForm, setShowImageUploadForm] = useState(false);
  const [imagesToUpload, setImagesToUpload] = useState<File[]>([]);
  const [uploadedAssets, setUploadedAssets] = useState<ImageType[]>([]);
  const [activeTab, setActiveTab] = useState<'assets' | 'blogs' | 'userSetting'>('blogs');
  const [userDetails, setUserDetails] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userId = data?.user.id || "";

  // Fetch user data
  const getUser = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const { success, data, message, error } = await getUserDetails(userId);
      console.log(error)
      if (!success) {
        toast.error(message || "Failed to load user details");
        return;
      }
      setUserDetails(data);
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while loading user data");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Handle profile update
  const handleUserDetailsSubmit = useCallback(async (details: {
    userName: string;
    email: string;
    fullName: string;
    profileImage?: string;
  }) => {
    try {
      const { success, data, message, error } = await updateUserDetails(userId, details);
      console.log(error)
      if (success) {
        toast.success("Profile updated successfully");
        setUserDetails(data);
      } else {
        toast.error(message || "Failed to update profile");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    }
  }, [userId]);

  // Handle password change
  const handlePasswordChange = useCallback(async (passwords: {
    oldPassword: string;
    newPassword: string;
  }) => {
    try {
      const { success, message, error, data } = await updateUserPassword(userId, passwords);
      console.log(error)
      console.log(data)
      if (success) {
        toast.success("Password updated successfully");
        await signOut();
      } else {
        toast.error(message || "Failed to update password");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    }
  }, [userId]);

  // Handle image upload
  const handleUploadAssets = useCallback(async () => {
    if (imagesToUpload.length === 0) {
      return toast.warning("Please select at least one image");
    }

    try {
      const { success, images } = await uploadAndSaveImages({
        files: imagesToUpload,
        userId,
      });

      if (success && Array.isArray(images)) {
        toast.success("Images uploaded successfully");
        setUploadedAssets(prev => [...prev, ...images]);
        setShowImageUploadForm(false);
        setImagesToUpload([]);
      } else {
        toast.error("Failed to upload images");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred during upload");
    }
  }, [imagesToUpload, userId]);

  // Handle image deletion
  const handleDeleteImage = useCallback(async (imageId: string) => {
    try {
      const { success, error } = await deleteImage({ imageId, userId });
      if (success) {
        toast.success("Image deleted successfully");
        setUploadedAssets(prev => prev.filter(img => img._id !== imageId));
      } else {
        toast.error(error || "Failed to delete image");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    }
  }, [userId]);

  // Copy image URL to clipboard
  const handleCopyUrl = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Image URL copied to clipboard");
  }, []);

  // Fetch user images
  const getImages = useCallback(async () => {
    try {
      const { success, images } = await getAllImages({ userId });
      if (success && Array.isArray(images)) {
        setUploadedAssets(images);
      } else {
        toast.error("Failed to load images");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    }
  }, [userId]);

  // Initial data loading
  useEffect(() => {
    if (userId) {
      getImages();
      getUser();
    }
  }, [userId, getImages, getUser]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-900 items-center justify-center">
        <div className="animate-spin rounded-none h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
      {/* Sidebar */}
      <aside className="w-72 bg-zinc-100 dark:bg-zinc-800 p-6 flex flex-col gap-6 border-r border-zinc-200 dark:border-zinc-700 sticky top-0 h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-40 h-40 bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center overflow-hidden border-2 border-red-600 rounded-none">
            {userDetails?.profileImage ? (
              <Image
                src={userDetails?.profileImage}
                alt={userDetails?.profileImage}
                width={160}
                height={160}
                className="object-cover w-full h-full"
                priority
              />
            ) : (
              <User size={48} className="text-zinc-500 dark:text-zinc-400" />
            )}
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{userDetails?.fullName}</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">@{userDetails?.userName}</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-2">
          <Button
            variant="ghost"
            className={`justify-start gap-3 rounded-none ${
              activeTab === 'blogs' 
                ? 'bg-zinc-200 dark:bg-zinc-700 text-red-600' 
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
            onClick={() => setActiveTab('blogs')}
          >
            <BookText className="h-5 w-5" />
            My Blogs
          </Button>
          <Button
            variant="ghost"
            className={`justify-start gap-3 rounded-none ${
              activeTab === 'assets' 
                ? 'bg-zinc-200 dark:bg-zinc-700 text-red-600' 
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
            onClick={() => setActiveTab('assets')}
          >
            <FileImage className="h-5 w-5" />
            My Assets
          </Button>
          <Button
            variant="ghost"
            className={`justify-start gap-3 rounded-none ${
              activeTab === 'userSetting' 
                ? 'bg-zinc-200 dark:bg-zinc-700 text-red-600' 
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
            onClick={() => setActiveTab("userSetting")}
          >
            <Settings className="h-5 w-5" />
            Settings
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">
            {activeTab === 'assets' ? 'Media Assets' :
              activeTab === 'blogs' ? 'Blog Posts' : 'Account Settings'}
          </h1>
          {activeTab === 'assets' && (
            <Button
              onClick={() => setShowImageUploadForm(true)}
              className="bg-red-600 text-white hover:bg-red-700 rounded-none flex gap-2"
            >
              <Upload className="h-5 w-5" />
              Upload Assets
            </Button>
          )}
          {activeTab === 'blogs' && (
            <Button className="bg-red-600 text-white hover:bg-red-700 rounded-none flex gap-2">
              <Edit className="h-5 w-5" />
              Create Blog
            </Button>
          )}
        </div>

        {/* Content Area */}
        {activeTab === 'assets' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedAssets.length > 0 ? (
              uploadedAssets.map((img) => (
                <div
                  key={img._id}
                  className="relative group bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-none hover:border-zinc-300 dark:hover:border-zinc-600 transition-all"
                >
                  <div className="aspect-square overflow-hidden rounded-t-lg">
                    <Image
                      src={img.url}
                      alt={img.originalName}
                      height={100}
                      width={100}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 truncate">{img.originalName}</p>
                    <div className="flex justify-between mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyUrl(img.url)}
                        className="text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-none p-1"
                        aria-label="Copy image URL"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteImage(img._id)}
                        className="text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded-none p-1"
                        aria-label="Delete image"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-none">
                <FileImage className="h-12 w-12 text-zinc-400 dark:text-zinc-500 mb-4" />
                <h3 className="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-2">No assets uploaded yet</h3>
                <p className="text-zinc-500 dark:text-zinc-400 mb-4">Upload your first asset to get started</p>
                <Button
                  onClick={() => setShowImageUploadForm(true)}
                  className="bg-red-600 text-white hover:bg-red-700 rounded-none"
                >
                  Upload Assets
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'blogs' && (
          <div className="border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-none p-8 flex flex-col items-center justify-center min-h-[400px]">
            <BookText className="h-12 w-12 text-zinc-400 dark:text-zinc-500 mb-4" />
            <h3 className="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-2">No blog posts yet</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-4">Create your first blog post to get started</p>
            <Button className="bg-red-600 text-white hover:bg-red-700 rounded-none">
              Create Blog Post
            </Button>
          </div>
        )}

        {activeTab === 'userSetting' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white dark:bg-zinc-800 p-6 border border-zinc-200 dark:border-zinc-700 rounded-none">
            <UpdateUserForm
              userDetails={{
                userName: userDetails?.userName || "",
                email: userDetails?.email || "",
                fullName: userDetails?.fullName || "",
                profileImage: userDetails?.profileImage || ""
              }}
              onUserDetailsSubmit={handleUserDetailsSubmit}
            />
            
            <ChangePasswordForm
              handleChangePassword={handlePasswordChange}
            />
          </div>
        )}
      </main>

      {/* Image Upload Modal */}
      {showImageUploadForm && (
        <div className="fixed inset-0 bg-black/70 dark:bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-800 p-6 w-full max-w-lg border border-zinc-200 dark:border-zinc-700 rounded-none shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Upload Assets</h2>
              <Button
                onClick={() => setShowImageUploadForm(false)}
                variant="ghost"
                className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 rounded-none p-1"
                aria-label="Close upload modal"
              >
                <span className="sr-only">Close</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </Button>
            </div>

            <Imagepkr images={imagesToUpload} setImages={setImagesToUpload} />

            <div className="flex justify-end gap-3 mt-6">
              <Button
                onClick={() => setShowImageUploadForm(false)}
                variant="outline"
                className="border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-none"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUploadAssets}
                className="bg-red-600 text-white hover:bg-red-700 rounded-none"
                disabled={imagesToUpload.length === 0}
              >
                Upload {imagesToUpload.length > 0 && `(${imagesToUpload.length})`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}