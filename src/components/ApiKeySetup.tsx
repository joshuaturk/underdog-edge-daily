import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Key, Globe, CheckCircle, AlertCircle } from 'lucide-react';
import { FirecrawlService } from '@/services/FirecrawlService';
import { useToast } from '@/hooks/use-toast';

interface ApiKeySetupProps {
  onApiKeySet: () => void;
}

export const ApiKeySetup = ({ onApiKeySet }: ApiKeySetupProps) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const { toast } = useToast();

  const handleTestAndSave = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter your Firecrawl API key",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const isValid = await FirecrawlService.testApiKey(apiKey);
      
      if (isValid) {
        FirecrawlService.saveApiKey(apiKey);
        setIsValidated(true);
        toast({
          title: "Success",
          description: "API key validated and saved successfully",
        });
        setTimeout(onApiKeySet, 1000);
      } else {
        toast({
          title: "Invalid API Key",
          description: "The provided API key is not valid. Please check and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Unable to validate API key. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const existingKey = FirecrawlService.getApiKey();

  if (existingKey && !isValidated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-gradient-to-br from-card to-card/80 border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5 text-profit" />
              API Key Found
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Firecrawl API key is already configured
            </p>
            <Button onClick={onApiKeySet} className="w-full">
              Continue to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            MLB Runline Analytics
          </h1>
          <p className="text-muted-foreground">
            Setup required to access live sports data
          </p>
        </div>

        {/* Setup Card */}
        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              Firecrawl API Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Globe className="h-4 w-4" />
              <AlertDescription>
                This application uses Firecrawl to scrape live MLB data from sports websites. 
                You'll need a Firecrawl API key to access real-time odds and game information.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">Firecrawl API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="fc-..."
                  className="transition-all duration-200"
                />
              </div>

              <Button 
                onClick={handleTestAndSave}
                disabled={isLoading || !apiKey.trim()}
                className="w-full"
              >
                {isLoading ? "Validating..." : "Test & Save API Key"}
              </Button>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">What you'll get:</h3>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-profit" />
                  Live MLB odds and runline data
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-profit" />
                  Daily automated analysis
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-profit" />
                  Team performance tracking
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-profit" />
                  Profit/loss tracking
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">How to get your API key:</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">1</Badge>
                <span className="text-sm">Visit <a href="https://firecrawl.dev" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">firecrawl.dev</a></span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">2</Badge>
                <span className="text-sm">Sign up for a free account</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">3</Badge>
                <span className="text-sm">Go to Dashboard → API Keys</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">4</Badge>
                <span className="text-sm">Copy your API key and paste it above</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Temporary Demo */}
        <Card className="bg-gradient-to-br from-secondary to-secondary/80 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Want to try the demo first?</h3>
                <p className="text-sm text-muted-foreground">
                  Experience the interface with simulated data
                </p>
              </div>
              <Button variant="outline" onClick={onApiKeySet}>
                Demo Mode
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};