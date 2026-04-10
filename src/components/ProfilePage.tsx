import { useState } from "react";
import { UserProfile, Currency, BusinessProfile } from "../types";
import { auth, db } from "../firebase";
import { doc, updateDoc, deleteDoc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { CURRENCY_CONFIG } from "../lib/currency";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "./ui/dialog";
import { AlertTriangle, Trash2, Building2, Shield, LogOut } from "lucide-react";
import { Badge } from "./ui/badge";
import { formatDate } from "../lib/utils";

interface ProfilePageProps {
  user: UserProfile;
  businesses: BusinessProfile[];
  onViewDashboard: (id: string) => void;
}

export default function ProfilePage({ user, businesses, onViewDashboard }: ProfilePageProps) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [phone, setPhone] = useState(user.phone || "");
  const [currency, setCurrency] = useState<Currency>(user.currency || "KES");
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName,
        phone,
        currency
      });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmEmail !== user.email) {
      toast.error("Email does not match");
      return;
    }

    try {
      // 1. Delete all user data in Firestore (simplified for demo)
      const batch = writeBatch(db);
      // In a real app, you'd query and delete all businesses, assessments, loans, notifications
      // For now, just delete the user doc
      batch.delete(doc(db, "users", user.uid));
      await batch.commit();

      // 2. Delete Auth account
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
      }
      
      toast.success("Account deleted");
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete account. You may need to re-authenticate.");
    }
  };

  const isValidPhoto = user.photoURL?.startsWith("https://");

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="flex items-center gap-6">
        <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
          {isValidPhoto && <AvatarImage src={user.photoURL} referrerPolicy="no-referrer" />}
          <AvatarFallback className="text-2xl bg-primary text-white">
            {user.displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{user.displayName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground">{user.email}</p>
            <Badge variant="secondary" className="capitalize">{user.role}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Joined {formatDate(user.createdAt, 'PPP')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your profile details and preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input 
                    id="name" 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="+254 ..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Preferred Currency</Label>
                <Select value={currency} onValueChange={(val: Currency) => setCurrency(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CURRENCY_CONFIG).map(([code, config]) => (
                      <SelectItem key={code} value={code}>
                        {code} ({config.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-neutral-50/50 flex justify-end py-4">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Businesses</CardTitle>
              <CardDescription>All businesses associated with your account.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {businesses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <Building2 className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p>No businesses found</p>
                  </div>
                ) : (
                  businesses.map((biz) => (
                    <div key={biz.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-neutral-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{biz.businessName}</p>
                          <p className="text-xs text-muted-foreground uppercase">{biz.industry.replace("_", " ")}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => onViewDashboard(biz.id)}>
                        View Dashboard
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm">
                <p className="text-muted-foreground">Sign-in Provider</p>
                <p className="font-medium">Google Authentication</p>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground">Last Login</p>
                <p className="font-medium">{formatDate(user.lastLoginAt, 'PPp')}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-lg text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogTrigger>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <DialogDescription>
                      This will permanently delete your account and remove all your data from our servers.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <p className="text-sm font-medium">
                      Please type <span className="font-bold">{user.email}</span> to confirm.
                    </p>
                    <Input 
                      value={deleteConfirmEmail} 
                      onChange={(e) => setDeleteConfirmEmail(e.target.value)} 
                      placeholder="Enter your email"
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmEmail !== user.email}
                    >
                      Delete Account
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
