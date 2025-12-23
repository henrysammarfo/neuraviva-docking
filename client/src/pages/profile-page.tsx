import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const AVATARS = [
    "marble", "beam", "pixel", "sunset", "bauhaus", "ring"
];

export default function ProfilePage() {
    const { user, logoutMutation } = useAuth();
    const { toast } = useToast();
    // Note: changing avatars requires a backend mutation which we haven't added yet to storage/routes,
    // so for this iteration it will verify selection UI but not persist without backend update.
    // We prioritize the UI flow as requested.
    const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || "marble");

    const handleSave = () => {
        // Mock save for now as verified scope was Auth+Profile UI
        toast({
            title: "Profile Updated",
            description: `Avatar set to ${selectedAvatar}. (Persistence pending backend update)`,
        });
    };

    return (
        <div className="container mx-auto p-8 max-w-2xl">
            <h1 className="text-3xl font-display font-bold mb-8">User Settings</h1>

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20 border-2 border-primary">
                            <AvatarImage src={`https://source.boringavatars.com/${selectedAvatar}/120/${user?.username}`} />
                            <AvatarFallback>{user?.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="text-xl font-bold">{user?.username}</h3>
                            <p className="text-muted-foreground">Researcher</p>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>User ID</Label>
                        <div className="p-2 bg-muted rounded font-mono text-sm">{user?.id}</div>
                    </div>
                </CardContent>
            </Card>

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Customize Avatar</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        {AVATARS.map((style) => (
                            <div
                                key={style}
                                className={`cursor-pointer rounded-lg p-2 border-2 transition-all ${selectedAvatar === style ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted"}`}
                                onClick={() => setSelectedAvatar(style)}
                            >
                                <div className="aspect-square rounded overflow-hidden mb-2">
                                    <img
                                        src={`https://source.boringavatars.com/${style}/120/${user?.username}`}
                                        alt={style}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <p className="text-center text-xs font-medium capitalize">{style}</p>
                            </div>
                        ))}
                    </div>
                    <Button onClick={handleSave} className="w-full">Save Changes</Button>
                </CardContent>
            </Card>

            <Button variant="destructive" className="w-full" onClick={() => logoutMutation.mutate()}>
                Logout
            </Button>
        </div>
    );
}
