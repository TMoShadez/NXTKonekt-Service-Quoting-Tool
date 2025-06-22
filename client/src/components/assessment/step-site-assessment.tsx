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
          {/* Infrastructure Requirements */}
          <div>
            <h3 className="text-lg font-semibold nxt-gray-800 mb-4">Infrastructure Requirements</h3>
            <div className="space-y-6">
              {/* Primary Connection and Installation Questions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium nxt-gray-800 mb-2">
                    How will this Internet Connection be used?
                  </Label>
                  <Select 
                    value={data.connectionUsage || ''} 
                    onValueChange={(value) => handleChange('connectionUsage', value)}
                  >
                    <SelectTrigger className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue">
                      <SelectValue placeholder="Select connection usage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="failover">Failover</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm font-medium nxt-gray-800 mb-2">
                    Where does the client want router installed?
                  </Label>
                  <Select 
                    value={data.routerLocation || ''} 
                    onValueChange={(value) => handleChange('routerLocation', value)}
                  >
                    <SelectTrigger className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue">
                      <SelectValue placeholder="Select installation location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in-rack">In Rack</SelectItem>
                      <SelectItem value="server-room">Server Room</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Network Signal Assessment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium nxt-gray-800 mb-2">
                    Network Signal
                  </Label>
                  <Select 
                    value={data.networkSignal || ''} 
                    onValueChange={(value) => handleChange('networkSignal', value)}
                  >
                    <SelectTrigger className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue">
                      <SelectValue placeholder="Select network type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4g">4G</SelectItem>
                      <SelectItem value="5g">5G</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm font-medium nxt-gray-800 mb-2">
                    Signal Strength
                  </Label>
                  <Select 
                    value={data.signalStrength || ''} 
                    onValueChange={(value) => handleChange('signalStrength', value)}
                  >
                    <SelectTrigger className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue">
                      <SelectValue placeholder="Select signal strength" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5-bars">5 bars</SelectItem>
                      <SelectItem value="4-bars">4 bars</SelectItem>
                      <SelectItem value="3-bars">3 bars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Low Signal Strength Notice and Additional Questions */}
              {data.signalStrength === '3-bars' && (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Due to Low Signal Strength:</strong> It is recommended to run an internal or external antenna. Please find an internal location with at least 4 signal bars. Determine if the client would like to run the required cables to complete the installation.
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium nxt-gray-800 mb-2">
                      Would the customer like to run a cable for an Antenna?
                    </Label>
                    <Select 
                      value={data.lowSignalAntennaCable || ''} 
                      onValueChange={(value) => handleChange('lowSignalAntennaCable', value)}
                    >
                      <SelectTrigger className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue">
                        <SelectValue placeholder="Select antenna cable option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {data.lowSignalAntennaCable === 'yes' && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium nxt-gray-800 mb-2">
                          Internal or External Antenna Requested?
                        </Label>
                        <Select 
                          value={data.antennaType || ''} 
                          onValueChange={(value) => handleChange('antennaType', value)}
                        >
                          <SelectTrigger className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue">
                            <SelectValue placeholder="Select antenna type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="internal">Internal</SelectItem>
                            <SelectItem value="external">External</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {data.antennaType === 'external' && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <p className="text-sm text-orange-800">
                            <strong>External Antenna Notice:</strong> If external antenna will be needed, please inform the client that the owner of the building will need to provide approval for external penetration prior to technician completing the installation.
                          </p>
                        </div>
                      )}

                      {(data.antennaType === 'internal' || data.antennaType === 'external') && (
                        <>
                          <div>
                            <Label className="text-sm font-medium nxt-gray-800 mb-2">
                              What is the recommended Antenna Installation Location?
                            </Label>
                            <Textarea
                              value={data.antennaInstallationLocation || ''}
                              onChange={(e) => handleChange('antennaInstallationLocation', e.target.value)}
                              placeholder="Describe the recommended antenna installation location..."
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue"
                              rows={3}
                            />
                          </div>

                          <div>
                            <Label className="text-sm font-medium nxt-gray-800 mb-2">
                              Estimated footage of cable needed to connect antenna?
                            </Label>
                            <Input
                              type="text"
                              placeholder="Enter cable length in feet"
                              value={data.cableFootage || ''}
                              onChange={(e) => handleChange('cableFootage', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue"
                            />
                            <p className="text-xs text-gray-600 mt-1">
                              Min 10 ft or up to 250 feet maximum
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Device Connection Assessment */}

              {/* Router Mounting Question for Server Room */}
              {data.routerLocation === 'server-room' && (
                <div>
                  <Label className="text-sm font-medium nxt-gray-800 mb-2">
                    Does the Wireless Router need to be mounted?
                  </Label>
                  <Select 
                    value={data.routerMounting || ''} 
                    onValueChange={(value) => handleChange('routerMounting', value)}
                  >
                    <SelectTrigger className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue">
                      <SelectValue placeholder="Select mounting requirement" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Firewall Question for Failover Connections */}
              {data.connectionUsage === 'failover' && (
                <div>
                  <Label className="text-sm font-medium nxt-gray-800 mb-2">
                    Is there an existing firewall or router in place that supports dual WAN connections?
                  </Label>
                  <Select 
                    value={data.dualWanSupport || ''} 
                    onValueChange={(value) => handleChange('dualWanSupport', value)}
                  >
                    <SelectTrigger className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue">
                      <SelectValue placeholder="Select dual WAN support" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium nxt-gray-800 mb-2">
                  Does the customer want assistance in connecting a networked device?
                </Label>
                <Select 
                  value={data.deviceConnectionAssistance || ''} 
                  onValueChange={(value) => handleChange('deviceConnectionAssistance', value)}
                >
                  <SelectTrigger className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue">
                    <SelectValue placeholder="Select device assistance option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Device Connection Notice */}
              {data.deviceConnectionAssistance === 'yes' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Installation includes:</strong>{' '}
                    {data.connectionUsage === 'primary' 
                      ? 'Up to 5 devices if Primary ISP selected' 
                      : data.connectionUsage === 'failover'
                      ? '1 device if Failover selected'
                      : 'Device connection assistance (number of devices depends on connection type)'}
                  </p>
                </div>
              )}


            </div>
          </div>

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

              {/* Ceiling Assessment for Internal Antenna */}
              {data.antennaType === 'internal' && (
                <>
                  <div>
                    <Label className="text-sm font-medium nxt-gray-800 mb-2">
                      How high are the ceilings?
                    </Label>
                    <Input
                      type="text"
                      placeholder="Enter ceiling height (e.g., 10 feet)"
                      value={data.ceilingHeight || ''}
                      onChange={(e) => handleChange('ceilingHeight', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium nxt-gray-800 mb-2">
                      What type of ceiling?
                    </Label>
                    <Select 
                      value={data.ceilingType || ''} 
                      onValueChange={(value) => handleChange('ceilingType', value)}
                    >
                      <SelectTrigger className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue">
                        <SelectValue placeholder="Select ceiling type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="drop-tile">Drop Tile</SelectItem>
                        <SelectItem value="solid">Solid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              
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

              <div>
                <Label className="text-sm font-medium nxt-gray-800 mb-2">
                  Make of Router for Installation
                </Label>
                <Select 
                  value={data.routerMake || ''} 
                  onValueChange={(value) => handleChange('routerMake', value)}
                >
                  <SelectTrigger className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue">
                    <SelectValue placeholder="Select router make" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inseego">Inseego</SelectItem>
                    <SelectItem value="cradlepoint">Cradlepoint</SelectItem>
                    <SelectItem value="inhand">InHand</SelectItem>
                    <SelectItem value="teltonica">Teltonica</SelectItem>
                    <SelectItem value="peplink">Peplink</SelectItem>
                    <SelectItem value="digi">Digi</SelectItem>
                    <SelectItem value="bec-technologies">BEC Technologies</SelectItem>
                    <SelectItem value="semtech-sierra">Semtech/ Sierra Wireless</SelectItem>
                    <SelectItem value="netgear">Netgear</SelectItem>
                    <SelectItem value="starlink">Starlink</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium nxt-gray-800 mb-2">
                  Model of Router?
                </Label>
                <Input
                  type="text"
                  placeholder="Enter router model"
                  value={data.routerModel || ''}
                  onChange={(e) => handleChange('routerModel', e.target.value.slice(0, 20))}
                  maxLength={20}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nxt-blue focus:border-nxt-blue"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum 20 characters</p>
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
