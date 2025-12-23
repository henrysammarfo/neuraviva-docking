import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, InsertUser } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    error: Error | null;
    loginMutation: any;
    logoutMutation: any;
    registerMutation: any;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: user, isLoading, error } = useQuery<User | null, Error>({
        queryKey: ["/api/user"],
        queryFn: async () => {
            const res = await fetch("/api/user");
            if (res.status === 401) return null;
            if (!res.ok) throw new Error("Failed to fetch user");
            return res.json();
        },
    });

    const loginMutation = useMutation({
        mutationFn: async (credentials: Pick<InsertUser, "username" | "password">) => {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(credentials),
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Login failed");
            }
            return res.json();
        },
        onSuccess: (user: User) => {
            queryClient.setQueryData(["/api/user"], user);
            toast({ title: "Welcome back!", description: `Logged in as ${user.username}` });
        },
        onError: (error: Error) => {
            toast({ title: "Login failed", description: error.message, variant: "destructive" });
        },
    });

    const registerMutation = useMutation({
        mutationFn: async (credentials: InsertUser) => {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(credentials),
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Registration failed");
            }
            return res.json();
        },
        onSuccess: (user: User) => {
            queryClient.setQueryData(["/api/user"], user);
            toast({ title: "Welcome!", description: `Account created for ${user.username}` });
        },
        onError: (error: Error) => {
            toast({ title: "Registration failed", description: error.message, variant: "destructive" });
        },
    });

    const logoutMutation = useMutation({
        mutationFn: async () => {
            await fetch("/api/logout", { method: "POST" });
        },
        onSuccess: () => {
            queryClient.setQueryData(["/api/user"], null);
            toast({ title: "Logged out", description: "See you next time!" });
        },
        onError: (error: Error) => {
            toast({ title: "Logout failed", description: error.message, variant: "destructive" });
        },
    });

    return (
        <AuthContext.Provider
            value={{
                user: user ?? null,
                isLoading,
                error,
                loginMutation,
                logoutMutation,
                registerMutation,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
