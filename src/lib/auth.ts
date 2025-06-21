import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import User from "@/models/user.model";
import { dbConnect } from "@/lib/dbConnect";
import { object, string } from "zod";
import type { User as AuthUser } from "next-auth";

// Custom error class for auth errors with a different name
class CustomAuthError extends Error {
    constructor(message: string, public type?: string) {
        super(message);
        this.name = "CustomAuthError";
    }
}

// Enhanced validation schema
const signInSchema = object({
    email: string({ required_error: "Email is required" })
        .min(1, "Email is required")
        .refine(
            (value) => {
                const isEmail = string().email().safeParse(value).success;
                const isUsername = /^[a-z0-9_]{3,20}$/.test(value);
                return isEmail || isUsername;
            },
            {
                message: "Must be a valid email or username (3-20 lowercase alphanumeric characters or underscores)",
            }
        ),
    password: string({ required_error: "Password is required" })
        .min(8, "Password must be at least 8 characters")
        .max(32, "Password must be less than 32 characters"),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email/Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                try {
                    await dbConnect();

                    // Validate input
                    const parsedCredentials = await signInSchema.parseAsync(credentials);
                    const { email, password } = parsedCredentials;

                    // Find user by email or username
                    const user = await User.findOne({
                        $or: [{ email }, { userName: email }],
                        isDeleted: false,
                    }).select("+password"); // Include password for validation

                    if (!user) {
                        throw new CustomAuthError("User Doesn't exist", "CredentialsSignin");
                    }
                    if(user.isDeleted){
                        throw new CustomAuthError("User Is Deleted", "CredentialsSignin");
                    }

                    // Validate password
                    const isValidPassword = await user.validatePassword(password);
                    if (!isValidPassword) {
                        throw new CustomAuthError("Invalid Password", "CredentialsSignin");
                    }

                    // Return sanitized user object
                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: user.fullName,
                        userName: user.userName,
                        image:user.profileImage

                    } as AuthUser;

                } catch (error) {
                    if (error instanceof CustomAuthError) {
                        throw error;
                    }
                    throw new CustomAuthError("Authentication failed", "CredentialsSignin");
                }
            },
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60,
    },
    pages: {
        signIn: "/auth/sign-in",
        error: "/auth/sign-in",
    },
    secret: process.env.AUTH_SECRET,
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.fullName = user.fullName;
                token.userName = user.userName;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.userName = token.userName as string;
                session.user.fullName = token.fullName as string;
                session.user.email = token.email as string;
                session.user.profileImage = token.profileImage as string
            }
            return session;
        },
    },
    events: {
        async signIn({ user }) {
            console.log(`User ${user.email} signed in`);
        },
    },
});
