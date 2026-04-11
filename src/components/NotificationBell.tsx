import { useState, useEffect } from "react";
import { Bell, Check, Info, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "./ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, writeBatch } from "firebase/firestore";
import { Notification } from "../types";
import { cn, formatDate } from "../lib/utils";
import { Badge } from "./ui/badge";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'notifications'));

    return () => unsubscribe();
  }, []);

  const markAllAsRead = async () => {
    if (!auth.currentUser || unreadCount === 0) return;
    const batch = writeBatch(db);
    notifications.filter(n => !n.read).forEach(n => {
      batch.update(doc(db, "notifications", n.id), { read: true });
    });
    await batch.commit();
  };

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, "notifications", id), { read: true });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'loan_approved': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'loan_rejected': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'loan_disbursed': return <Info className="h-4 w-4 text-blue-500" />;
      case 'repayment_due': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'assessment_complete': return <Check className="h-4 w-4 text-primary" />;
      default: return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-white border-2 border-white">
              {unreadCount}
            </Badge>
          )}
        </Button>
      } />
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-8" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No notifications yet
            </div>
          ) : (
            notifications.map((n) => (
              <DropdownMenuItem 
                key={n.id} 
                className={cn(
                  "flex flex-col items-start p-4 cursor-pointer border-l-4 border-transparent focus:bg-muted",
                  !n.read && "bg-blue-50/50 border-l-primary"
                )}
                onSelect={() => markAsRead(n.id)}
              >
                <div className="flex items-center gap-2 mb-1">
                  {getIcon(n.type)}
                  <span className="font-medium text-sm">{n.title}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                  {n.message}
                </p>
                <span className="text-[10px] text-muted-foreground uppercase">
                  {formatDate(n.createdAt, 'MMM d, h:mm a')}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
