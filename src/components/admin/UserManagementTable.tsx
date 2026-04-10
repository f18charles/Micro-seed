import { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { collection, onSnapshot, doc, updateDoc, query, where, getDocs } from "firebase/firestore";
import { UserProfile } from "../../types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { formatDate } from "../../lib/utils";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "../ui/dialog";
import { Button } from "../ui/button";

export default function UserManagementTable() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
    });
    return () => unsubscribe();
  }, []);

  const handleRoleChangeRequest = (user: UserProfile, checked: boolean) => {
    setSelectedUser(user);
    setNewRole(checked ? 'admin' : 'user');
    setIsRoleDialogOpen(true);
  };

  const confirmRoleChange = async () => {
    if (!selectedUser) return;
    
    try {
      await updateDoc(doc(db, "users", selectedUser.uid), {
        role: newRole
      });
      toast.success(`User role updated to ${newRole}`);
      setIsRoleDialogOpen(false);
    } catch (error) {
      toast.error("Failed to update user role");
    }
  };

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Admin Access</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.uid}>
              <TableCell className="font-medium">{user.displayName}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
              <TableCell className="text-sm">{formatDate(user.createdAt, 'MMM d, yyyy')}</TableCell>
              <TableCell>
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-2">
                  <Switch 
                    id={`admin-${user.uid}`} 
                    checked={user.role === 'admin'} 
                    onCheckedChange={(checked) => handleRoleChangeRequest(user, checked)}
                    disabled={user.uid === auth.currentUser?.uid} // Can't demote self
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Role Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to {newRole === 'admin' ? 'promote' : 'demote'} <strong>{selectedUser?.displayName}</strong>?
              {newRole === 'admin' ? ' They will have full access to all platform data.' : ' They will lose administrative access.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRoleDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmRoleChange}>Confirm Change</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
