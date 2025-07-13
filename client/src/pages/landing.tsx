import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import nxtKonektLogo from "@assets/NxtKonekt Astro 5_1749972215768.png";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const isLocalhost = window.location.hostname.includes('localhost');
  const productionUrl = window.location.protocol + '//' + window.location.hostname.replace('localhost:5000', 'f80523b4-52dc-45cc-bda8-89c5a1a9b3dd-00-2vzuokq3tubk4.spock.replit.dev');

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
            <h2 className="text-3xl font-bold nxt-gray-800 mb-2">NXTKonekt</h2>
            <p className="nxt-gray-500 text-lg mb-8">Site Assessment Tool</p>
            
            {isLocalhost ? (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-left">
                  <p className="text-sm text-yellow-800 font-medium mb-2">⚠️ Development Access</p>
                  <p className="text-sm text-yellow-700 mb-3">
                    Authentication requires the live domain. Click below to access the production application:
                  </p>
                  <Button 
                    onClick={() => window.location.href = productionUrl}
                    className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Access Live Application
                  </Button>
                </div>
                
                <Button 
                  onClick={handleLogin}
                  variant="outline"
                  className="w-full py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Continue with Localhost (Limited)
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleLogin}
                className="w-full py-3 px-4 bg-nxt-blue text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-nxt-blue focus:ring-offset-2 transition-colors"
              >
                Sign In
              </Button>
            )}
            
            <p className="mt-4 text-sm nxt-gray-500">
              Access your assessment dashboard and create new quotes
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
