import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Key, CheckCircle, AlertCircle } from 'lucide-react';
import { SportsAPIService } from '@/services/SportsAPIService';
import { useToast } from '@/hooks/use-toast';

interface SportsAPISetupProps {
  onApiKeySet: () => void;
}

export const SportsAPISetup = ({ onApiKeySet }: SportsAPISetupProps) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const { toast } = useToast();

  const testAndSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter an API key",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const isValidKey = await SportsAPIService.testApiKey(apiKey.trim());
      
      if (isValidKey) {
        SportsAPIService.saveApiKey(apiKey.trim());
        setIsValid(true);
        
        toast({
          title: "Success!",
          description: "API key validated and saved successfully"
        });
        
        onApiKeySet();
      } else {
        setIsValid(false);
        toast({
          title: "Invalid API Key",
          description: "The API key couldn't be validated. Please check and try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      setIsValid(false);
      toast({
        title: "Error",
        description: "Failed to validate API key. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const useESPNFallback = () => {
    toast({
      title: "Using ESPN Data",
      description: "Switching to ESPN API for game data (free, no registration required)"
    });
    onApiKeySet();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            Sports Data API Setup
          </CardTitle>
          <CardDescription>
            Choose your preferred method to get MLB game data and odds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="odds-api" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="odds-api" className="flex items-center gap-2">
                <Badge variant="outline" className="bg-profit/10 text-profit border-profit/20">
                  Premium
                </Badge>
                The Odds API
              </TabsTrigger>
              <TabsTrigger value="espn" className="flex items-center gap-2">
                <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                  Free
                </Badge>
                ESPN Data
              </TabsTrigger>
            </TabsList>

            <TabsContent value="odds-api" className="space-y-4 mt-6">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>The Odds API</strong> provides real-time odds from major sportsbooks with accurate runline data.
                  <br />Get 500 free requests per month, then $1 per 1000 requests.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key">The Odds API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your The Odds API key..."
                    className="font-mono"
                  />
                  {isValid !== null && (
                    <div className={`flex items-center gap-2 text-sm ${isValid ? 'text-profit' : 'text-loss'}`}>
                      {isValid ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      {isValid ? 'API key is valid!' : 'API key is invalid'}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={testAndSaveApiKey} 
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? 'Validating...' : 'Save & Validate Key'}
                  </Button>
                  <Button 
                    variant="outline" 
                    asChild
                    className="shrink-0"
                  >
                    <a 
                      href="https://the-odds-api.com/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      Get API Key <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Setup Instructions:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Visit The Odds API website and create a free account</li>
                    <li>Copy your API key from the dashboard</li>
                    <li>Paste it above and click "Save & Validate Key"</li>
                  </ol>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="espn" className="space-y-4 mt-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>ESPN API</strong> provides game schedules and scores but with simulated odds data.
                  <br />No registration required - completely free to use.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    ESPN provides official MLB game data including schedules, scores, and team information.
                    Odds will be simulated for demonstration purposes.
                  </p>
                </div>

                <Button onClick={useESPNFallback} className="w-full">
                  Use ESPN Data (Free)
                </Button>

                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>What you get:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Real game schedules and team matchups</li>
                    <li>Live scores and game status</li>
                    <li>Simulated betting odds for analysis</li>
                    <li>No API key or registration required</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};