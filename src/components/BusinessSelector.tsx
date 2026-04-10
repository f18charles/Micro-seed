import { BusinessProfile } from "../types";
import { Select as ShadSelect, SelectContent as ShadContent, SelectItem as ShadItem, SelectTrigger as ShadTrigger, SelectValue as ShadValue } from "./ui/select";
import { Plus, Building2 } from "lucide-react";
import { Badge } from "./ui/badge";

interface BusinessSelectorProps {
  businesses: BusinessProfile[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onAddNew: () => void;
}

export default function BusinessSelector({ businesses, activeId, onSelect, onAddNew }: BusinessSelectorProps) {
  return (
    <ShadSelect value={activeId || ""} onValueChange={(val) => val === "new" ? onAddNew() : onSelect(val)}>
      <ShadTrigger className="w-[240px] bg-white">
        <ShadValue placeholder="Select Business" />
      </ShadTrigger>
      <ShadContent>
        {businesses.map((biz) => (
          <ShadItem key={biz.id} value={biz.id} className="flex flex-col items-start py-2">
            <div className="flex items-center gap-2 w-full">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{biz.businessName}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px] uppercase">
                {biz.industry.replace("_", " ")}
              </Badge>
            </div>
          </ShadItem>
        ))}
        <ShadItem value="new" className="text-primary font-medium border-t mt-1">
          <Plus className="h-4 w-4 mr-2" />
          Add New Business
        </ShadItem>
      </ShadContent>
    </ShadSelect>
  );
}
