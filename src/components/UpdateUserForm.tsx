import { Label } from "@radix-ui/react-label";
import React, { FormEvent, useCallback, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Loader2, User } from "lucide-react";

export interface UserDetailsUpdate {
  userName: string;
  email: string;
  profileImage: string;
  fullName: string;
}

interface FormErrors {
  userName?: string;
  email?: string;
  fullName?: string;
  profileImage?: string;
}

export default function UpdateUserForm({
  userDetails,
  onUserDetailsSubmit
}: {
  userDetails: UserDetailsUpdate;
  onUserDetailsSubmit: (updatedUserData: UserDetailsUpdate) => Promise<void> | void;
}): React.ReactElement {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (data: UserDetailsUpdate): boolean => {
    const newErrors: FormErrors = {};

    if (!data.userName.trim()) {
      newErrors.userName = "Username is required";
    } else if (data.userName.length < 3) {
      newErrors.userName = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(data.userName)) {
      newErrors.userName = "Username can only contain letters, numbers, and underscores";
    }

    if (!data.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!data.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (data.profileImage && !/^https?:\/\/.+\..+/.test(data.profileImage)) {
      newErrors.profileImage = "Please enter a valid URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSubmitting(true);

      const formData = new FormData(e.currentTarget);
      const updatedUserData: UserDetailsUpdate = {
        userName: formData.get('userName') as string,
        email: formData.get('email') as string,
        fullName: formData.get('fullName') as string,
        profileImage: formData.get('profileImage') as string
      };

      if (validateForm(updatedUserData)) {
        try {
          await onUserDetailsSubmit(updatedUserData);
        } catch (error) {
          // Handle API errors here if needed
          console.error("Update failed:", error);
        } finally {
          setIsSubmitting(false);
        }
      } else {
        setIsSubmitting(false);
      }
    },
    [onUserDetailsSubmit]
  );

  return (
    <div className="w-full max-w-md mx-auto h-full p-6 bg-zinc-900 rounded-none ">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-zinc-100">
        <User className="h-5 w-5" />
        Update Profile Details
      </h2>
      <form onSubmit={handleFormSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-zinc-300 block mb-1">
            Email
          </Label>
          <Input
            type="email"
            id="email"
            name="email"
            placeholder="Email"
            defaultValue={userDetails.email}
            className="border-zinc-700 bg-zinc-800 text-zinc-100 focus:ring-2 focus:ring-red-500 focus:border-red-500 rounded-none"
            required
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="userName" className="text-zinc-300 block mb-1">
            Username
          </Label>
          <Input
            type="text"
            id="userName"
            name="userName"
            defaultValue={userDetails.userName}
            placeholder="Username"
            className="border-zinc-700 bg-zinc-800 text-zinc-100 focus:ring-2 focus:ring-red-500 focus:border-red-500 rounded-none"
            required
          />
          {errors.userName && (
            <p className="text-red-500 text-sm">{errors.userName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-zinc-300 block mb-1">
            Full Name
          </Label>
          <Input
            type="text"
            id="fullName"
            name="fullName"
            defaultValue={userDetails.fullName}
            placeholder="Full Name"
            className="border-zinc-700 bg-zinc-800 text-zinc-100 focus:ring-2 focus:ring-red-500 focus:border-red-500 rounded-none"
            required
          />
          {errors.fullName && (
            <p className="text-red-500 text-sm">{errors.fullName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="profileImage" className="text-zinc-300 block mb-1">
            Profile Image URL
          </Label>
          <Input
            type="url"
            id="profileImage"
            name="profileImage"
            defaultValue={userDetails.profileImage}
            placeholder="https://example.com/profile.jpg"
            className="border-zinc-700 bg-zinc-800 text-zinc-100 focus:ring-2 focus:ring-red-500 focus:border-red-500 rounded-none"
          />
          {errors.profileImage && (
            <p className="text-red-500 text-sm">{errors.profileImage}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full mt-6 bg-red-700 hover:bg-red-800 text-white rounded-none flex items-center justify-center gap-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Profile"
          )}
        </Button>
      </form>
    </div>
  );
}