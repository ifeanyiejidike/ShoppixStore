"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { axiosInstance } from "@/lib/axios.config";
import { registerFormSchema, RegisterSchema } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

export default function RegistrationPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  // const [preview, setPreview] = useState<string | null>(null);

  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];

  //   if (file) {
  //     setPreview(URL.createObjectURL(file));
  //   } else {
  //     setPreview(null)
  //   }
  // };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterSchema>({ resolver: zodResolver(registerFormSchema) });

  const router = useRouter();

  async function onSubmit(data: RegisterSchema) {
    try {
      await axiosInstance.post("users", data);

      toast.success("Registration successful! login", {
        position: "top-right",
      });

      setTimeout(() => {
        router.push("/auth/login");
      }, 2_000);
    } catch {
      const errorMesssage = "Registration failed";
      toast.error(errorMesssage, { position: "top-center" });
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 py-16">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">
          Register
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} id="signup-form" className="space-y-4">

          {/* Username */}
          {/* <div>
            <label className="block text-sm mb-1 text-gray-600 dark:text-gray-300">
              Username
            </label>
            <input
              type="text"
              id="user-name"
              name="user-name"
              placeholder="Enter your username"
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 
                focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-indigo-400 
                bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200" />
          </div> */}

          {/* Email */}
          <div>
            <label className="block text-sm mb-1 text-gray-600 dark:text-gray-300">
              Email
            </label>
            <input 
              type="email" 
              id="email" 
              placeholder="Enter your email address"
              disabled={isSubmitting} 
              {...register("email")} 
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-indigo-400 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200" />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
              )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm mb-1 text-gray-600 dark:text-gray-300">
              Password
            </label>
            <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              id="password1" 
              placeholder="Create a password"
              autoComplete="on" 
              disabled={isSubmitting}
              {...register("password")}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-indigo-400 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
            />

            <button  
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {errors.password && (
            <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
          )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm mb-1 text-gray-600 dark:text-gray-300">
              Re-enter Password
            </label>
            <div className="relative">
              <input 
                type={showConfirm ? "text" : "password"} 
                id="password2"
                placeholder="Re-enter your password"
                autoComplete="on" 
                disabled={isSubmitting}
                {...register("confirm_password")}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-indigo-400 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200" />

              <button
                type="button" 
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-600"
               >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirm_password && (
              <p className="text-sm text-red-600 mt-1">{errors.confirm_password.message}</p>
                )}
          </div>

          {/* Avatar */}
          {/* <div>
            <span className="block text-sm mb-1 text-gray-600 dark:text-gray-300">
              Avatar (JPG/PNG/WEBP, max 2MB)
            </span>
            <div className="relative">
              <Input 
                type="file"
                accept="image/*"
                {...register("avatar", {
                  onChange: (e) => {
                    handleFileChange(e);
                  },
                })}
               />
              {errors.avatar && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.avatar.message as string}
                </p>
              )}
            </div>
          </div>

          {preview && (
            <div className="mb-4">
              <span className="block text-sm">Preview</span>
              <Image
              src={preview}
              alt="Avatar Preview"
              height={400}
              width={400}
              className="w-24 h-24 object-cover rounded" />
            </div>
          )} */}

          {/* Submit */}
          <Button
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-2 rounded-lg bg-cyan-500- bg-cyan-500 hover:bg-cyan-600 text-white font-medium hover:bg-pink-700- transition"
           >
            {isSubmitting ? <Spinner /> : "Register"}
           </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <hr className="flex-grow border-gray-300 dark:border-gray-600" />
          <span className="px-2 text-gray-500 dark:text-gray-400 text-sm">or</span>
          <hr className="flex-grow border-gray-300 dark:border-gray-600" />
        </div>

        {/* Google Sign Up */}
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border 
            border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 
            text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-100 
            dark:hover:bg-gray-800 transition"
        >
          <FaGoogle className="text-red-500" size={18} />
          Sign up with Google
        </button>

        {/* Redirect */}
        <p className="text-sm text-center mt-4 text-gray-600">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-cyan-500 font-semibold hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}