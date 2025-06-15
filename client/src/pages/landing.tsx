import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wifi } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-nxt-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-nxt-blue rounded-xl flex items-center justify-center mb-6">
              <Wifi className="text-white text-2xl" size={32} />
            </div>
            <h2 className="text-3xl font-bold nxt-gray-800 mb-2">NXT Konekt</h2>
            <p className="nxt-gray-500 text-lg mb-8">Site Assessment Tool</p>
            
            <Button 
              onClick={handleLogin}
              className="w-full py-3 px-4 bg-nxt-blue text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-nxt-blue focus:ring-offset-2 transition-colors"
            >
              Sign In
            </Button>
            
            <p className="mt-4 text-sm nxt-gray-500">
              Access your assessment dashboard and create new quotes
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
