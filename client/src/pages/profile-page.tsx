import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

const AVATARS = [
    "identicon", "bottts", "avataaars", "pixel-art", "lorelei", "shapes"
];

export default function ProfilePage() {
    const { user, logoutMutation } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || "identicon");

    const updateProfileMutation = useMutation({
        mutationFn: async (avatar: string) => {
            const res = await fetch("/api/user", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ avatar }),
            });
            if (!res.ok) throw new Error("Failed to update avatar");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
            toast({
                title: "Profile Updated",
                description: "Your avatar has been updated successfully.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Update Failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const getAvatarUrl = (style: string, seed: string) => {
        return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
    };

    return (
        <div className="container mx-auto p-8 max-w-2xl">
            <h1 className="text-3xl font-display font-bold mb-8 text-foreground tracking-tight">User Settings</h1>

            <Card className="mb-8 border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20 border-2 border-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]">
                            <AvatarImage src={getAvatarUrl(user?.avatar || "identicon", user?.username || "user")} />
                            <AvatarFallback>{user?.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="text-xl font-bold text-foreground">{user?.username}</h3>
                            <p className="text-muted-foreground">Lead Researcher</p>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label className="text-muted-foreground">User ID</Label>
                        <div className="p-2 bg-background/50 border border-border/50 rounded font-mono text-xs text-primary">{user?.id}</div>
                    </div>
                </CardContent>
            </Card>

            <Card className="mb-8 border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Customize Avatar</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        {AVATARS.map((style) => (
                            <div
                                key={style}
                                className={`cursor-pointer rounded-lg p-3 border-2 transition-all hover:scale-105 ${selectedAvatar === style ? "border-primary bg-primary/10" : "border-border/50 bg-background/30 hover:bg-background/50"}`}
                                onClick={() => setSelectedAvatar(style)}
                            >
                                <div className="aspect-square rounded overflow-hidden mb-2">
                                    <img
                                        src={getAvatarUrl(style, user?.username || "user")}
                                        alt={style}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <p className="text-center text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{style}</p>
                            </div>
                        ))}
                    </div>
                    <Button
                        onClick={() => updateProfileMutation.mutate(selectedAvatar)}
                        className="w-full shadow-[0_0_20px_rgba(0,255,255,0.2)]"
                        disabled={updateProfileMutation.isPending || selectedAvatar === user?.avatar}
                    >
                        {updateProfileMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Changes
                    </Button>
                </CardContent>
            </Card>

            <Button variant="outline" className="w-full border-red-500/50 text-red-500 hover:bg-red-500/10" onClick={() => logoutMutation.mutate()}>
                Logout Account
            </Button>
        </div>
    );
}
