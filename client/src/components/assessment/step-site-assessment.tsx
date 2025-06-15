import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Assessment } from "@shared/schema";

interface StepSiteAssessmentProps {
  data: Partial<Assessment>;
  onChange: (data: Partial<Assessment>) => void;
}

export function StepSiteAssessment({ data, onChange }: StepSiteAssessmentProps) {
  const handleChange = (field: keyof Assessment, value: string | number | boolean) => {
    onChange({ [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold nxt-gray-800">
          Technical Site Assessment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Site Characteristics */}
          <div>
            <h3 className="text-lg font-semibold nxt-gray-800 mb-4">Site Characteristics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium nxt-gray-800 mb-2">
                  Building Type
                </Label>
                <Select 
                  value={data.buildingType || ''} 
                  onValueChange={(value) => handleChange('buildingType', value)}
                >
                  <SelectTrigger className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue">
                    <SelectValue placeholder="Select building type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single-story">Single Story</SelectItem>
                    <SelectItem value="multi-story">Multi Story</SelectItem>
                    <SelectItem value="warehouse">Warehouse</SelectItem>
                    <SelectItem value="office-complex">Office Complex</SelectItem>
                    <SelectItem value="retail-space">Retail Space</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium nxt-gray-800 mb-2">
                  Coverage Area (sq ft)
                </Label>
                <Input
                  type="number"
                  placeholder="Enter square footage"
                  value={data.coverageArea || ''}
                  onChange={(e) => handleChange('coverageArea', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium nxt-gray-800 mb-2">
                  Number of Floors
                </Label>
                <Input
                  type="number"
                  placeholder="Enter number of floors"
                  value={data.floors || ''}
                  onChange={(e) => handleChange('floors', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium nxt-gray-800 mb-2">
                  Expected Device Count
                </Label>
                <Input
                  type="number"
                  placeholder="Estimated devices to connect"
                  value={data.deviceCount || ''}
                  onChange={(e) => handleChange('deviceCount', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue"
                />
              </div>
            </div>
          </div>

          {/* Infrastructure Requirements */}
          <div>
            <h3 className="text-lg font-semibold nxt-gray-800 mb-4">Infrastructure Requirements</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="power-available"
                  checked={data.powerAvailable || false}
                  onCheckedChange={(checked) => handleChange('powerAvailable', !!checked)}
                />
                <Label htmlFor="power-available" className="text-sm nxt-gray-800">
                  Power outlets available at installation locations
                </Label>
              </div>
              
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="ethernet-required"
                  checked={data.ethernetRequired || false}
                  onCheckedChange={(checked) => handleChange('ethernetRequired', !!checked)}
                />
                <Label htmlFor="ethernet-required" className="text-sm nxt-gray-800">
                  Ethernet backhaul required
                </Label>
              </div>
              
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="ceiling-mount"
                  checked={data.ceilingMount || false}
                  onCheckedChange={(checked) => handleChange('ceilingMount', !!checked)}
                />
                <Label htmlFor="ceiling-mount" className="text-sm nxt-gray-800">
                  Ceiling mounting required
                </Label>
              </div>
              
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="outdoor-coverage"
                  checked={data.outdoorCoverage || false}
                  onCheckedChange={(checked) => handleChange('outdoorCoverage', !!checked)}
                />
                <Label htmlFor="outdoor-coverage" className="text-sm nxt-gray-800">
                  Outdoor coverage needed
                </Label>
              </div>
            </div>
          </div>

          {/* Environmental Factors */}
          <div>
            <h3 className="text-lg font-semibold nxt-gray-800 mb-4">Environmental Factors</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium nxt-gray-800 mb-2">
                  Interference Sources
                </Label>
                <Textarea
                  placeholder="List any potential interference sources"
                  value={data.interferenceSources || ''}
                  onChange={(e) => handleChange('interferenceSources', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue"
                  rows={3}
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium nxt-gray-800 mb-2">
                  Special Requirements
                </Label>
                <Textarea
                  placeholder="Any special installation requirements"
                  value={data.specialRequirements || ''}
                  onChange={(e) => handleChange('specialRequirements', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue"
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
