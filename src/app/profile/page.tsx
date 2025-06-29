"use client";

import { useEffect, useState, useCallback } from "react";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import Image from "next/image";


// Import UI components and icons as needed
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";

// Import icons
import { Upload, User, Copy, Trash, Edit, Image as ImageIcon, BookText, Settings, Key, AlertCircle, Menu } from "lucide-react";

// Custom Forms and Additional Components
import UpdateUserForm, { UserDetailsUpdate } from "@/components/UpdateUserForm";

import BlogCard from "../blogs/component/BlogCard";
import { deleteUserAccount, getUserDetails, updateUserDetails, updateUserPassword, UserResponse } from "../actions/userAction";
import { deleteImage, getAllImages, ImageType, uploadAndSaveImages } from "../actions/imagesAction";
import ChangePasswordForm, { Passwords } from "@/components/ChangePassword";
import Imagepkr from "@/components/UploadAssetForm";
import { getBlogs, GetBlogsResponse } from "../actions/blogsAction";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ProfilePage = () => {
  const { data: session, update, status } = useSession();
  const userId = session?.user?.id || "";
  const router = useRouter()

  // State Management
  const [activeTab, setActiveTab] = useState("blogs");
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDetails, setUserDetails] = useState<UserResponse | null>(null);
  const [myBlogs, setMyBlogs] = useState<GetBlogsResponse[]>([]);
  const [uploadedAssets, setUploadedAssets] = useState<ImageType[]>([]);
  const [showImageUploadForm, setShowImageUploadForm] = useState(false);
  const [imagesToUpload, setImagesToUpload] = useState<File[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const tabs = [
    { value: "blogs", icon: <BookText />, label: "My Blogs" },
    { value: "assets", icon: <ImageIcon />, label: "My Assets" },
    { value: "settings", icon: <Settings />, label: "Settings" },
  ];

  // Data Fetching Functions
  const fetchUserDetails = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);

      const { success, data, message } = await getUserDetails(userId);

      if (success && data) {
        setUserDetails(data as UserResponse);
      } else {
        toast.error("Failed to load user details");
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error("An error occurred while loading user data");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const fetchUserBlogs = useCallback(async () => {
    if (!userId) return;
    try {
      const { success, data, message } = await getBlogs(userId);
      console.log(data)
      if (success) setMyBlogs(data as GetBlogsResponse[]);
      else toast.error(message || "Failed to load user blogs");
    } catch (error) {
      console.error("Error fetching user blogs:", error);
    }
  }, [userId]);

  const fetchImages = useCallback(async () => {
    if (!userId) return;
    try {
      const { success, images } = await getAllImages({ userId });
      if (success && images) setUploadedAssets(images as ImageType[]);
      else toast.error("Failed to load images");
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
      fetchUserBlogs();
      fetchImages();
    }
  }, [userId, fetchUserDetails, fetchUserBlogs, fetchImages]);

  // Form Handlers
  const handleUserDetailsSubmit = useCallback(
    async (details: UserDetailsUpdate) => {
      try {
        const { success, data, message } = await updateUserDetails(
          userId,
          details
        );
        if (success) {
          toast.success("Profile updated successfully");
          setUserDetails(data);
        } else {
          toast.error(message || "Failed to update profile");
        }
      } catch (error) {
        console.error("Error updating user details:", error);
        toast.error("An unexpected error occurred");
      }
    },
    [userId]
  );

  const handlePasswordChange = useCallback(
    async (passwordDetails: Passwords) => {
      try {
        const { success, message } = await updateUserPassword(
          userId,
          passwordDetails
        );
        if (success) {
          toast.success("Password updated successfully");
        } else {
          toast.error(message || "Failed to update password");
        }
      } catch (error) {
        console.error("Error updating password:", error);
        toast.error("An unexpected error occurred");
      }
    },
    [userId]
  );

  const handleUploadAssets = useCallback(async () => {
    if (imagesToUpload.length === 0) {
      return toast.warning("Please select at least one image");
    }

    try {
      const { success, images } = await uploadAndSaveImages({
        files: imagesToUpload,
        userId,
      });

      if (success && images) {
        toast.success("Images uploaded successfully");
        console.log(images)
        setUploadedAssets((prev: ImageType[]) => [...prev, ...images as ImageType[]]);
        setShowImageUploadForm(false);
        setImagesToUpload([]);
      } else {
        toast.error("Failed to upload images");
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("An unexpected error occurred during upload");
    }
  }, [imagesToUpload, userId]);


  const handleDeleteImage = useCallback(
    async (imageId: string) => {
      try {
        const { success } = await deleteImage({ imageId, userId });
        if (success) {
          toast.success("Image deleted successfully");
          setUploadedAssets((prev) => prev.filter((img) => img._id !== imageId));
        } else {
          toast.error("Failed to delete image");
        }
      } catch (error) {
        console.error("Error deleting image:", error);
        toast.error("An unexpected error occurred");
      }
    },
    [userId]
  );

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Image URL copied to clipboard");
    });
  };

  const handleDeleteAccount = async () => {
    try {
      const { success, message } = await deleteUserAccount(userId);
      if (success) {
        toast.success(message || "Account deleted successfully");
        signOut()
      } else {
        toast.error(message || "Failed to delete account");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col space-y-4 w-full max-w-4xl p-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
          <Skeleton className="h-[500px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-10 bg-background border-b p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Profile</h1>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block w-full md:w-64 flex-shrink-0`}>
          <Card className="md:sticky md:top-8 h-screen rounded-none">
            <CardHeader className="flex flex-col items-center">
              <Avatar className="h-24 w-24 border-2 border-primary">
                <AvatarImage src={userDetails?.profileImage || ""} alt="User Profile" />
                <AvatarFallback>
                  <User className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              <div className="text-center mt-4">
                <h3 className="text-xl font-bold">{userDetails?.fullName}</h3>
                <p className="text-sm text-muted-foreground">
                  @{userDetails?.userName}
                </p>
                <p>{userDetails?.bio}</p>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="tabs">
                <TabsList className="grid w-full focus:bg-red-200">
                  {tabs.map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      onClick={() => {
                        setActiveTab(tab.value);
                        setMobileMenuOpen(false);
                      }}
                      className="justify-start gap-3 h-12 bg-transparent"
                    >
                      {tab.icon}
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Mobile Tab Title */}
          <div className="md:hidden mb-6">
            <h1 className="text-2xl font-bold">
              {activeTab === "blogs" && "My Blog Posts"}
              {activeTab === "assets" && "Media Assets"}
              {activeTab === "settings" && "Account Settings"}
            </h1>
          </div>

          {/* Desktop Tab Title and Actions */}
          <div className="hidden md:flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">
              {activeTab === "blogs" && "My Blog Posts"}
              {activeTab === "assets" && "Media Assets"}
              {activeTab === "settings" && "Account Settings"}
            </h1>
            {activeTab === "blogs" && (
              <Link href={"/create-blog"} className="flex p-2 bg-zinc-950 text-zinc-50 dark:text-zinc-950 font-semibold dark:bg-zinc-50 items-center justify-between gap-2">
                <Edit className="h-4 w-4" />
                Create Blog
              </Link>
            )}
            {activeTab === "assets" && (
              <Button
                onClick={() => setShowImageUploadForm(true)}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Assets
              </Button>
            )}
          </div>

          {/* Tab Content */}
          <div className={activeTab !== "blogs" ? "hidden" : ""}>
            <Card>
              <CardHeader className="md:hidden">
                <CardTitle className="flex items-center gap-2">
                  <BookText className="h-5 w-5" />
                  My Blog Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {myBlogs.length > 0 ? (
                  <div className="grid gap-6">
                    {myBlogs.map((blog) => (
                      <BlogCard details={blog} key={blog.id} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <BookText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      No blog posts yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first blog post to get started
                    </p>
                    <Link href={"/create-blog"} className="flex p-2 bg-zinc-950 text-zinc-50 dark:text-zinc-950 font-semibold dark:bg-zinc-50 items-center justify-between gap-2">
                      <Edit className="h-4 w-4" />
                      Create Blog
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className={activeTab !== "assets" ? "hidden" : ""}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  <span className="hidden md:inline">Media Assets</span>
                </CardTitle>
                <Button
                  onClick={() => setShowImageUploadForm(true)}
                  className="gap-2"
                  size="sm"
                >
                  <Upload className="h-4 w-4" />
                  <span className="hidden md:inline">Upload</span>
                </Button>
              </CardHeader>
              <CardContent>
                {uploadedAssets.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {uploadedAssets.map((img: ImageType) => (
                      <div
                        key={img._id}
                        className="relative group rounded-none overflow-hidden border"
                      >
                        <div className="aspect-square overflow-hidden">
                          <Image
                            src={img?.url}
                            alt={img.originalName}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                          <div className="flex justify-between w-full">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCopyUrl(img.url)}
                              className="text-white hover:bg-white/20 h-8 w-8"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteImage(img._id)}
                              className="text-white hover:bg-white/20 h-8 w-8"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      No assets uploaded yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Upload your first asset to get started
                    </p>
                    <Button
                      onClick={() => setShowImageUploadForm(true)}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Assets
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className={activeTab !== "settings" ? "hidden" : ""}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Account Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-8">
                <UpdateUserForm
                  userDetails={{
                    userName: userDetails?.userName || "",
                    email: userDetails?.email || "",
                    fullName: userDetails?.fullName || "",
                    profileImage: userDetails?.profileImage || "",
                    bio: userDetails?.bio || "",
                    profession: userDetails?.profession || "",
                  }}
                  onUserDetailsSubmit={handleUserDetailsSubmit}
                />

                <Separator />

                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                    <Key className="h-5 w-5" />
                    Change Password
                  </h3>
                  <ChangePasswordForm
                    handleChangePassword={handlePasswordChange}
                  />
                </div>

                <Separator />

                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold mb-4 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    Danger Zone
                  </h3>
                  <div className="rounded-none border border-destructive p-4">
                    <div className="flex flex-col space-y-2">
                      <h4 className="font-medium">
                        Delete your account permanently
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        This action cannot be undone. All your data will be
                        permanently removed.
                      </p>
                      <Dialog
                        open={isDeleteDialogOpen}
                        onOpenChange={setIsDeleteDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="destructive"
                            className="mt-2 gap-2 w-full sm:w-auto"
                          >
                            <Trash className="h-4 w-4" />
                            Delete Account
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <AlertCircle className="h-5 w-5 text-destructive" />
                              Confirm Account Deletion
                            </DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete your account?
                              This action cannot be undone. All your data,
                              including blogs and images, will be permanently
                              removed.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setIsDeleteDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={handleDeleteAccount}
                            >
                              Delete Account
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Image Upload Modal */}
      {showImageUploadForm && (
        <Dialog
          open={showImageUploadForm}
          onOpenChange={setShowImageUploadForm}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Assets
              </DialogTitle>
              <DialogDescription>
                Select images to upload. Max file size: 5MB each.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Imagepkr
                images={imagesToUpload}
                setImages={setImagesToUpload}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowImageUploadForm(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUploadAssets}
                disabled={imagesToUpload.length === 0}
              >
                Upload {imagesToUpload.length > 0 && `(${imagesToUpload.length})`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ProfilePage;
