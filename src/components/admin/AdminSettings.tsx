import { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { doc, getDoc, setDoc, serverTimestamp, collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { GlobalSettings, AuditLog } from "../../types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { auditLogService } from "../../services/auditLog";
import { formatDate } from "../../lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Settings, History, Save, ShieldAlert, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

export default function AdminSettings() {
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "app_settings", "global");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as GlobalSettings);
        } else {
          // Initialize default settings if they don't exist
          const defaults: GlobalSettings = {
            defaultInterestRate: 12,
            maxLoanAmount: 100000,
            minLoanAmount: 1000,
            loanTermMonths: 12,
            maintenanceMode: false,
            maintenanceMessage: "MicroSeed is currently undergoing scheduled maintenance. We'll be back shortly.",
            allowNewRegistrations: true,
            allowNewApplications: true,
            platformName: "MicroSeed Finance",
            supportEmail: "support@microseed.com",
            updatedAt: serverTimestamp() as any,
            updatedBy: auth.currentUser?.uid || "system"
          };
          await setDoc(docRef, defaults);
          setSettings(defaults);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const logsQuery = query(
      collection(db, "audit_logs"), 
      orderBy("createdAt", "desc"), 
      limit(50)
    );
    const unsubLogs = onSnapshot(logsQuery, (s) => {
      setAuditLogs(s.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog)));
    });

    fetchSettings();
    return () => unsubLogs();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || !auth.currentUser) return;

    setIsSaving(true);
    try {
      const oldSettingsSnap = await getDoc(doc(db, "app_settings", "global"));
      const oldSettings = oldSettingsSnap.data();

      const newSettings = {
        ...settings,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser.uid
      };

      await setDoc(doc(db, "app_settings", "global"), newSettings);
      
      await auditLogService.writeAuditLog({
        action: 'settings_updated',
        targetId: 'global',
        targetType: 'settings',
        before: oldSettings || null,
        after: newSettings
      });

      toast.success("Settings updated successfully");
    } catch (error) {
      toast.error("Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  const exportAuditLog = () => {
    const headers = ["Timestamp", "Admin", "Action", "Target", "Reason"];
    const rows = auditLogs.map(log => [
      formatDate(log.createdAt, 'yyyy-MM-dd HH:mm:ss'),
      log.adminEmail,
      log.action,
      `${log.targetType}:${log.targetId}`,
      log.reason || ""
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `microseed-audit-log-${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  if (isLoading) return <div className="p-12 text-center">Loading settings...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Platform Settings</h2>
        <p className="text-muted-foreground">Configure global parameters and audit platform activity.</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="bg-white border mb-6">
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            General Settings
          </TabsTrigger>
          <TabsTrigger value="audit">
            <History className="h-4 w-4 mr-2" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <form onSubmit={handleSave} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Financial Settings */}
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Financial Configuration</CardTitle>
                  <CardDescription>Default loan parameters for the platform.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="interest">Default Interest Rate (%)</Label>
                    <Input 
                      id="interest" 
                      type="number" 
                      value={settings?.defaultInterestRate} 
                      onChange={(e) => setSettings(s => s ? { ...s, defaultInterestRate: Number(e.target.value) } : null)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minLoan">Min Loan (KSh)</Label>
                      <Input 
                        id="minLoan" 
                        type="number" 
                        value={settings?.minLoanAmount} 
                        onChange={(e) => setSettings(s => s ? { ...s, minLoanAmount: Number(e.target.value) } : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxLoan">Max Loan (KSh)</Label>
                      <Input 
                        id="maxLoan" 
                        type="number" 
                        value={settings?.maxLoanAmount} 
                        onChange={(e) => setSettings(s => s ? { ...s, maxLoanAmount: Number(e.target.value) } : null)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Platform Controls */}
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Platform Controls</CardTitle>
                  <CardDescription>Enable or disable core platform features.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow New Registrations</Label>
                      <p className="text-xs text-muted-foreground">Enable sign-ups for new users.</p>
                    </div>
                    <Switch 
                      checked={settings?.allowNewRegistrations} 
                      onCheckedChange={(val) => setSettings(s => s ? { ...s, allowNewRegistrations: val } : null)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow New Applications</Label>
                      <p className="text-xs text-muted-foreground">Enable new loan application submissions.</p>
                    </div>
                    <Switch 
                      checked={settings?.allowNewApplications} 
                      onCheckedChange={(val) => setSettings(s => s ? { ...s, allowNewApplications: val } : null)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <div className="space-y-0.5">
                      <Label className="text-orange-900 flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4" />
                        Maintenance Mode
                      </Label>
                      <p className="text-[10px] text-orange-700">Block access for non-admin users.</p>
                    </div>
                    <Switch 
                      checked={settings?.maintenanceMode} 
                      onCheckedChange={(val) => setSettings(s => s ? { ...s, maintenanceMode: val } : null)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Maintenance Message */}
              <Card className="md:col-span-2 border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Maintenance Message</CardTitle>
                  <CardDescription>Shown to users when maintenance mode is active.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    className="min-h-[100px]"
                    value={settings?.maintenanceMessage}
                    onChange={(e) => setSettings(s => s ? { ...s, maintenanceMessage: e.target.value } : null)}
                  />
                </CardContent>
                <CardFooter className="flex justify-end border-t bg-neutral-50/50 py-4">
                  <Button type="submit" disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Platform Settings"}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="audit">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Full Audit Log</CardTitle>
                <CardDescription>Every administrative action is recorded here.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={exportAuditLog}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(log.createdAt, 'MMM d, h:mm a')}
                        </TableCell>
                        <TableCell className="font-medium text-xs">{log.adminEmail}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] uppercase font-bold">
                            {log.action.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[10px] font-mono text-muted-foreground">
                          {log.targetType}:{log.targetId.slice(0, 8)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
