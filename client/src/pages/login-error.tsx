import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import nxtKonektLogo from "@assets/NxtKonekt Astro 5_1749972215768.png";

export default function LoginError() {
  const urlParams = new URLSearchParams(window.location.search);
  const reason = urlParams.get('reason');
  const details = urlParams.get('details');
  
  const handleRetryLogin = () => {
    window.location.href = "/api/login";
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-nxt-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="mx-auto h-20 w-20 mb-6 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
              <img 
                src={nxtKonektLogo} 
                alt="NXTKonekt Logo" 
                className="h-16 w-16 object-contain"
              />
            </div>
            
            <div className="mx-auto h-12 w-12 mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            
            <h2 className="text-2xl font-bold nxt-gray-800 mb-2">Login Issue</h2>
            <p className="nxt-gray-500 text-base mb-6">
              We encountered a problem signing you in. This can happen if:
            </p>
            
            <div className="text-left bg-gray-50 p-4 rounded-lg mb-6">
              <ul className="text-sm nxt-gray-600 space-y-2">
                <li>• You're accessing via localhost (use the live domain instead)</li>
                <li>• Your browser has cookies disabled</li>
                <li>• You denied account access permissions</li>
                <li>• There was a temporary connection issue</li>
                <li>• Your session expired during login</li>
                <li>• The custom domain isn't registered with the authentication provider</li>
              </ul>
            </div>
            
            {window.location.hostname === 'nxtkonektpartners.com' && (
              <div className="text-left bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
                <p className="text-sm text-yellow-800 font-medium mb-2">⚠️ Custom Domain Authentication</p>
                <p className="text-sm text-yellow-700 mb-2">
                  You're accessing from nxtkonektpartners.com, which requires special configuration.
                </p>
                <p className="text-sm text-yellow-700">
                  <strong>Temporary Solution:</strong> Try logging in from the main Replit domain first:
                </p>
                <div className="mt-2">
                  <Button 
                    onClick={() => window.open('https://f80523b4-52dc-45cc-bda8-89c5a1a9b3dd-00-2vzuokq3tubk4.spock.replit.dev/api/login', '_blank')}
                    variant="outline"
                    size="sm"
                    className="text-yellow-800 border-yellow-300 hover:bg-yellow-100"
                  >
                    Login via Replit Domain
                  </Button>
                </div>
              </div>
            )}
            
            {reason && (
              <div className="text-left bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
                <p className="text-sm text-red-800 font-medium mb-2">🔍 Technical Details</p>
                <p className="text-sm text-red-700 mb-2">Error Type: {reason}</p>
                {details && (
                  <p className="text-xs text-red-600 font-mono bg-red-100 p-2 rounded">
                    {decodeURIComponent(details)}
                  </p>
                )}
              </div>
            )}
            
            {window.location.hostname.includes('localhost') && (
              <div className="text-left bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                <p className="text-sm text-blue-800 font-medium mb-2">⚠️ Development Access Detected</p>
                <p className="text-sm text-blue-700">
                  You're accessing via localhost. For authentication to work, please use the live application URL. 
                  The app will automatically redirect you to the correct domain when you try to sign in.
                </p>
              </div>
            )}
            
            <div className="space-y-3">
              <Button 
                onClick={handleRetryLogin}
                className="w-full py-3 px-4 bg-nxt-blue text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-nxt-blue focus:ring-offset-2 transition-colors"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Signing In Again
              </Button>
              
              <Button 
                onClick={handleGoHome}
                variant="outline"
                className="w-full py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Back to Home
              </Button>
            </div>
            
            <p className="mt-6 text-xs nxt-gray-400">
              If you continue having issues, please contact support
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}