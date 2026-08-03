import { z } from "zod";

export const signupSchema = z.object({
    name: z.string().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(72, "Password must be at most 72 characters")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/,
            "Password must contain at least one uppercase letter, one lowercase letter, and one number"
        ),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // บอกว่า Error นี้เกิดที่ช่อง confirmPassword
});
