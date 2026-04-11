import React, { useState } from 'react';
import { 
  UserPlus, 
  Users, 
  Trash2, 
  Mail, 
  Phone, 
  ShieldCheck,
  Plus,
  Loader2
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { db, auth } from '../firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Guarantor, GuarantorStatus } from '../types';
import { toast } from 'sonner';

interface GuarantorInvitationProps {
  applicationId: string;
  minGuarantors: number;
  onComplete: (guarantorIds: string[]) => void;
}

export default function GuarantorInvitation({ 
  applicationId, 
  minGuarantors, 
  onComplete 
}: GuarantorInvitationProps) {
  const [guarantors, setGuarantors] = useState<Partial<Guarantor>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newGuarantor, setNewGuarantor] = useState({
    fullName: '',
    nationalIdNumber: '',
    kraPinNumber: '',
    phone: '',
    email: '',
    relationship: ''
  });

  const handleAdd = () => {
    if (!newGuarantor.fullName || !newGuarantor.email || !newGuarantor.phone || !newGuarantor.relationship) {
      toast.error("Please fill in all guarantor details");
      return;
    }
    setGuarantors(prev => [...prev, { ...newGuarantor, id: 'temp_' + Date.now() }]);
    setNewGuarantor({
      fullName: '',
      nationalIdNumber: '',
      kraPinNumber: '',
      phone: '',
      email: '',
      relationship: ''
    });
  };

  const handleRemove = (id: string) => {
    setGuarantors(prev => prev.filter(g => g.id !== id));
  };

  const handleSubmit = async () => {
    if (guarantors.length < minGuarantors) {
      toast.error(`You need at least ${minGuarantors} guarantors`);
      return;
    }

    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const guarantorIds: string[] = [];
      
      for (const g of guarantors) {
        const gId = 'gua_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        const guarantorData: Guarantor = {
          id: gId,
          loanApplicationId: applicationId,
          applicantUserId: user.uid,
          fullName: g.fullName!,
          nationalIdNumber: g.nationalIdNumber!,
          kraPinNumber: g.kraPinNumber!,
          phone: g.phone!,
          email: g.email!,
          relationship: g.relationship!,
          status: 'invited',
          invitedAt: serverTimestamp() as any,
          documents: [],
          consentText: "By accepting, I confirm I am a willing guarantor for this loan. I understand that if the borrower defaults, I may be contacted by the lender for repayment assistance. I confirm my identity details provided are accurate. I consent to the lender retaining my KYC information for legal purposes."
        };

        await setDoc(doc(db, 'guarantors', gId), guarantorData);
        guarantorIds.push(gId);
        
        // In a real app, trigger email/SMS here
        console.log(`Inviting guarantor: ${g.email}`);
      }

      toast.success("Guarantors invited successfully");
      onComplete(guarantorIds);
    } catch (error: any) {
      toast.error("Failed to invite guarantors: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-primary" />
          Add Guarantors
        </h2>
        <p className="text-muted-foreground">
          You need at least <strong>{minGuarantors}</strong> verified guarantors to proceed with this loan application.
        </p>
      </div>

      <Card className="border-2 border-dashed bg-neutral-50/50">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input 
                value={newGuarantor.fullName} 
                onChange={(e) => setNewGuarantor(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Guarantor's legal name"
              />
            </div>
            <div className="space-y-2">
              <Label>Relationship</Label>
              <Select 
                value={newGuarantor.relationship} 
                onValueChange={(v) => setNewGuarantor(prev => ({ ...prev, relationship: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Business Partner">Business Partner</SelectItem>
                  <SelectItem value="Family Member">Family Member</SelectItem>
                  <SelectItem value="Friend">Friend</SelectItem>
                  <SelectItem value="Employer">Employer</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  className="pl-9"
                  value={newGuarantor.email} 
                  onChange={(e) => setNewGuarantor(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  className="pl-9"
                  value={newGuarantor.phone} 
                  onChange={(e) => setNewGuarantor(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="07XXXXXXXX"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>National ID Number</Label>
              <Input 
                value={newGuarantor.nationalIdNumber} 
                onChange={(e) => setNewGuarantor(prev => ({ ...prev, nationalIdNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>KRA PIN</Label>
              <Input 
                value={newGuarantor.kraPinNumber} 
                onChange={(e) => setNewGuarantor(prev => ({ ...prev, kraPinNumber: e.target.value }))}
              />
            </div>
          </div>

          <Button variant="secondary" className="w-full" onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" /> Add to List
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-muted-foreground" />
            Added Guarantors ({guarantors.length})
          </h3>
          {guarantors.length < minGuarantors && (
            <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
              {minGuarantors - guarantors.length} more required
            </Badge>
          )}
        </div>

        {guarantors.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
            No guarantors added yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {guarantors.map((g) => (
              <Card key={g.id} className="relative group overflow-hidden border-primary/20 bg-primary/5">
                <CardContent className="p-4 flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="font-bold">{g.fullName}</p>
                    <p className="text-xs text-muted-foreground">{g.relationship} • {g.email}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="text-[10px] uppercase">ID: *{g.nationalIdNumber?.slice(-4)}</Badge>
                      <Badge variant="secondary" className="text-[10px] uppercase">PIN: *{g.kraPinNumber?.slice(-4)}</Badge>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemove(g.id!)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Button 
        className="w-full h-14 text-xl font-black" 
        disabled={guarantors.length < minGuarantors || isLoading}
        onClick={handleSubmit}
      >
        {isLoading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <ShieldCheck className="w-6 h-6 mr-2" />}
        Invite Guarantors & Continue
      </Button>
    </div>
  );
}
