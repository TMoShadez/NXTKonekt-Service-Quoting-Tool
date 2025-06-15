import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Assessment } from "@shared/schema";

interface StepSalesExecutiveProps {
  data: Partial<Assessment>;
  onChange: (data: Partial<Assessment>) => void;
}

export function StepSalesExecutive({ data, onChange }: StepSalesExecutiveProps) {
  const handleChange = (field: keyof Assessment, value: string) => {
    onChange({ [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold nxt-gray-800">
          Sales Executive Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-sm font-medium nxt-gray-800 mb-2">
              Sales Executive Name
            </Label>
            <Input
              type="text"
              placeholder="Enter your name"
              value={data.salesExecutiveName || ''}
              onChange={(e) => handleChange('salesExecutiveName', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue"
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium nxt-gray-800 mb-2">
              Email Address
            </Label>
            <Input
              type="email"
              placeholder="Enter email address"
              value={data.salesExecutiveEmail || ''}
              onChange={(e) => handleChange('salesExecutiveEmail', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue"
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium nxt-gray-800 mb-2">
              Phone Number
            </Label>
            <Input
              type="tel"
              placeholder="Enter phone number"
              value={data.salesExecutivePhone || ''}
              onChange={(e) => handleChange('salesExecutivePhone', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue"
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium nxt-gray-800 mb-2">
              Organization Name
            </Label>
            <Input
              type="text"
              placeholder="Enter organization name"
              value={data.organizationId?.toString() || ''}
              onChange={(e) => handleChange('organizationId', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
