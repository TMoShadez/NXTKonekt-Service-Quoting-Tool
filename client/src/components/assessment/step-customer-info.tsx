import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import type { Assessment } from "@shared/schema";

interface StepCustomerInfoProps {
  data: Partial<Assessment>;
  onChange: (data: Partial<Assessment>) => void;
}

export function StepCustomerInfo({ data, onChange }: StepCustomerInfoProps) {
  const handleChange = (field: keyof Assessment, value: string | Date) => {
    onChange({ [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold nxt-gray-800">
          Customer Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-sm font-medium nxt-gray-800 mb-2">
              Company Name
            </Label>
            <Input
              type="text"
              placeholder="Enter company name"
              value={data.customerCompanyName || ''}
              onChange={(e) => handleChange('customerCompanyName', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue"
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium nxt-gray-800 mb-2">
              Contact Person
            </Label>
            <Input
              type="text"
              placeholder="Enter contact name"
              value={data.customerContactName || ''}
              onChange={(e) => handleChange('customerContactName', e.target.value)}
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
              value={data.customerEmail || ''}
              onChange={(e) => handleChange('customerEmail', e.target.value)}
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
              value={data.customerPhone || ''}
              onChange={(e) => handleChange('customerPhone', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue"
            />
          </div>
          
          <div className="md:col-span-2">
            <Label className="text-sm font-medium nxt-gray-800 mb-2">
              Site Address
            </Label>
            <Textarea
              placeholder="Enter complete site address"
              value={data.siteAddress || ''}
              onChange={(e) => handleChange('siteAddress', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue"
              rows={3}
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium nxt-gray-800 mb-2">
              Industry Type
            </Label>
            <Select 
              value={data.industry || ''} 
              onValueChange={(value) => handleChange('industry', value)}
            >
              <SelectTrigger className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue">
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                <SelectItem value="hospitality">Hospitality</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label className="text-sm font-medium nxt-gray-800">
                Preferred Installation Date
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-nxt-blue cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div className="p-2">
                      <p className="font-medium text-sm mb-1">Installation SLA Notice</p>
                      <p className="text-xs">
                        Installation requires a 48-hour SLA to allow for equipment arrival confirmation. 
                        Please select a date that accommodates this requirement.
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              type="date"
              value={data.preferredInstallationDate ? new Date(data.preferredInstallationDate).toISOString().split('T')[0] : ''}
              onChange={(e) => handleChange('preferredInstallationDate', new Date(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue"
              min={new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0]}
            />
            <p className="text-xs nxt-gray-500 mt-1">
              Minimum 48 hours from today required for equipment confirmation
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
