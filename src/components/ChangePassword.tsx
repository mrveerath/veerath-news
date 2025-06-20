import { Label } from "@radix-ui/react-label";
import React, { FormEvent, useCallback, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Eye, EyeOff } from "lucide-react";

export interface Passwords {
  oldPassword: string;
  newPassword: string;
}

interface FormErrors {
  oldPassword?: string;
  newPassword?: string;
}

export default function ChangePasswordForm({
  handleChangePassword
}: {
  handleChangePassword: (updatedPasswordData: Passwords) => void;
}): React.ReactElement {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (oldPassword: string, newPassword: string): boolean => {
    const newErrors: FormErrors = {};

    if (!oldPassword) {
      newErrors.oldPassword = "Current password is required";
    }

    if (!newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(newPassword)) {
      newErrors.newPassword = "Password must contain at least one uppercase letter";
    } else if (!/[a-z]/.test(newPassword)) {
      newErrors.newPassword = "Password must contain at least one lowercase letter";
    } else if (!/[0-9]/.test(newPassword)) {
      newErrors.newPassword = "Password must contain at least one number";
    } else if (!/[^A-Za-z0-9]/.test(newPassword)) {
      newErrors.newPassword = "Password must contain at least one special character";
    } else if (oldPassword && newPassword === oldPassword) {
      newErrors.newPassword = "New password must be different from current password";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSubmitting(true);

      const formData = new FormData(e.currentTarget);
      const oldPassword = formData.get("oldPassword") as string;
      const newPassword = formData.get("newPassword") as string;

      if (validateForm(oldPassword, newPassword)) {
        try {
          await handleChangePassword({
            oldPassword,
            newPassword
          });
        } finally {
          setIsSubmitting(false);
        }
      } else {
        setIsSubmitting(false);
      }
    },
    [handleChangePassword]
  );

  return (
    <div className="w-full max-w-md mx-auto h-full p-6 bg-zinc-900 rounded-none border border-zinc-800">
      <h1 className="text-2xl font-bold text-zinc-100 mb-6 text-center">
        Change Your Password
      </h1>
      <form onSubmit={handleFormSubmit} className="space-y-7">
        <div className="space-y-2">
          <Label htmlFor="oldPassword" className="text-zinc-300 block mb-1">
            Current Password
          </Label>
          <div className="relative">
            <Input
              type={showOldPassword ? "text" : "password"}
              id="oldPassword"
              name="oldPassword"
              placeholder="Enter current password"
              className="border-zinc-700 bg-zinc-800 text-zinc-100 focus:ring-2 focus:ring-red-500 focus:border-red-500 rounded-none pr-10"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 text-zinc-400 hover:text-zinc-100"
              onClick={() => setShowOldPassword(!showOldPassword)}
            >
              {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </Button>
          </div>
          {errors.oldPassword && (
            <p className="text-red-500 text-sm">{errors.oldPassword}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword" className="text-zinc-300 block mb-1">
            New Password
          </Label>
          <div className="relative">
            <Input
              type={showNewPassword ? "text" : "password"}
              id="newPassword"
              name="newPassword"
              placeholder="Enter new password"
              className="border-zinc-700 bg-zinc-800 text-zinc-100 focus:ring-2 focus:ring-red-500 focus:border-red-500 rounded-none pr-10"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 text-zinc-400 hover:text-zinc-100"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </Button>
          </div>
          {errors.newPassword && (
            <p className="text-red-500 text-sm">{errors.newPassword}</p>
          )}
          <div className="text-zinc-400 text-xs mt-1">
            Password must contain:
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li className={/^.{8,}$/.test(errors.newPassword || "") ? "text-red-500" : "text-red-500"}>
                At least 8 characters
              </li>
              <li className={/[A-Z]/.test(errors.newPassword || "") ? "text-red-500" : "text-red-500"}>
                One uppercase letter
              </li>
              <li className={/[a-z]/.test(errors.newPassword || "") ? "text-red-500" : "text-red-500"}>
                One lowercase letter
              </li>
              <li className={/[0-9]/.test(errors.newPassword || "") ? "text-red-500" : "text-red-500"}>
                One number
              </li>
              <li className={/[^A-Za-z0-9]/.test(errors.newPassword || "") ? "text-red-500" : "text-red-500"}>
                One special character
              </li>
              <li className={/[^A-Za-z0-9]/.test(errors.newPassword || "") ? "text-red-500" : "text-red-500"}>
                Both Password Can `&apos;`t Be Same
              </li>
            </ul>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full mt-6 bg-red-700 hover:bg-red-800 text-white rounded-none flex items-center justify-center gap-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </div>
  );
}