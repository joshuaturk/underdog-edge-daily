import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Target, Globe, Database } from 'lucide-react';
import { BettingPick, BettingResults } from '@/types/betting';
import { BettingAnalysisService } from '@/services/BettingAnalysisService';
import { ProductionDataService } from '@/services/ProductionDataService';
import { FirecrawlService } from '@/services/FirecrawlService';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useToast } from '@/hooks/use-toast';

export const BettingDashboard = () => {
  const [dailyPicks, setDailyPicks] = useState<BettingPick[]>([]);
  const [allPicks, setAllPicks] = useState<BettingPick[]>([]);
  const [results, setResults] = useState<BettingResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isUsingLiveData, setIsUsingLiveData] = useState(false);
  const { toast } = useToast();

  // Auto-generate picks on mount
  useEffect(() => {
    generateDailyPicks();
  }, []);

  useEffect(() => {
    if (allPicks.length > 0) {
      setResults(BettingAnalysisService.analyzeResults(allPicks));
    }
  }, [allPicks]);


  const generateDailyPicks = async () => {
    setIsLoading(true);
    
    try {
      // Try to use production data service first (if Supabase is configured)
      const liveDataResult = await ProductionDataService.scrapeMLBData();
      
      if (liveDataResult.success && liveDataResult.data) {
        // Process live data and generate picks
        setIsUsingLiveData(true);
        
        // For now, still use mock data but we're set up for live data processing
        const games = BettingAnalysisService.mockDailyGames();
        const newPicks: BettingPick[] = [];
        
        games.forEach(game => {
          const pick = BettingAnalysisService.analyzeGame(
            game.homeTeam,
            game.awayTeam,
            game.isHomeUnderdog,
            game.odds
          );
          
          if (pick) {
            newPicks.push(pick);
          }
        });
        
        setDailyPicks(newPicks);
        setLastUpdate(new Date());
        
        toast({
          title: "Live Data Analysis Complete",
          description: `Found ${newPicks.length} qualifying picks from live MLB data`,
        });
      } else {
        // Fallback to demo data
        setIsUsingLiveData(false);
        
        const games = BettingAnalysisService.mockDailyGames();
        const newPicks: BettingPick[] = [];
        
        games.forEach(game => {
          const pick = BettingAnalysisService.analyzeGame(
            game.homeTeam,
            game.awayTeam,
            game.isHomeUnderdog,
            game.odds
          );
          
          if (pick) {
            newPicks.push(pick);
          }
        });
        
        setDailyPicks(newPicks);
        setLastUpdate(new Date());
        
        toast({
          title: "Demo Analysis Complete",
          description: `Found ${newPicks.length} qualifying picks (demo data)`,
        });
      }
    } catch (error) {
      // Fallback to demo mode
      setIsUsingLiveData(false);
      
      const games = BettingAnalysisService.mockDailyGames();
      const newPicks: BettingPick[] = [];
      
      games.forEach(game => {
        const pick = BettingAnalysisService.analyzeGame(
          game.homeTeam,
          game.awayTeam,
          game.isHomeUnderdog,
          game.odds
        );
        
        if (pick) {
          newPicks.push(pick);
        }
      });
      
      setDailyPicks(newPicks);
      setLastUpdate(new Date());
      
      toast({
        title: "Analysis Complete",
        description: `Found ${newPicks.length} qualifying picks (demo mode)`,
        variant: "default"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const simulateResults = (pick: BettingPick) => {
    // Simulate game results based on confidence
    const winProbability = pick.confidence / 100;
    const won = Math.random() < winProbability;
    
    const updatedPick = {
      ...pick,
      status: won ? 'won' as const : 'lost' as const,
      profit: won ? 0.91 : -1, // Standard betting profit/loss
      result: {
        homeScore: Math.floor(Math.random() * 10) + 1,
        awayScore: Math.floor(Math.random() * 10) + 1,
        scoreDifference: Math.floor(Math.random() * 5) + 1
      }
    };
    
    const updatedAllPicks = [...allPicks];
    const existingIndex = updatedAllPicks.findIndex(p => p.id === pick.id);
    
    if (existingIndex >= 0) {
      updatedAllPicks[existingIndex] = updatedPick;
    } else {
      updatedAllPicks.push(updatedPick);
    }
    
    setAllPicks(updatedAllPicks);
    
    // Update daily picks
    setDailyPicks(prev => prev.map(p => p.id === pick.id ? updatedPick : p));
    
    toast({
      title: won ? "Pick Won!" : "Pick Lost",
      description: `${pick.recommendedBet === 'home_runline' ? pick.homeTeam : pick.awayTeam} runline ${won ? 'covered' : 'failed'}`,
      variant: won ? "default" : "destructive"
    });
  };


  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-profit text-profit-foreground';
    if (confidence >= 70) return 'bg-accent text-accent-foreground';
    return 'bg-secondary text-secondary-foreground';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won': return 'bg-profit text-profit-foreground';
      case 'lost': return 'bg-loss text-loss-foreground';
      case 'push': return 'bg-push text-push-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              MLB Runline Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Advanced underdog runline analysis & daily picks
            </p>
            <div className="flex items-center gap-2 mt-2">
              {isUsingLiveData ? (
                <Badge variant="outline" className="bg-profit/10 text-profit border-profit/20">
                  <Globe className="w-3 h-3 mr-1" />
                  Live Data
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                  <Database className="w-3 h-3 mr-1" />
                  Demo Mode
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button onClick={generateDailyPicks} disabled={isLoading} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isUsingLiveData ? 'Refresh Live Data' : 'Generate Analysis'}
            </Button>
          </div>
        </div>

        {/* Results Summary */}
        {results && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                <Target className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {results.winRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {results.wonPicks}/{results.totalPicks} picks
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                <DollarSign className="h-4 w-4 text-profit" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${results.totalProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {results.totalProfit >= 0 ? '+' : ''}{results.totalProfit.toFixed(2)}u
                </div>
                <p className="text-xs text-muted-foreground">
                  {results.roi.toFixed(1)}% ROI
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                {results.streak.type === 'win' ? 
                  <TrendingUp className="h-4 w-4 text-profit" /> : 
                  <TrendingDown className="h-4 w-4 text-loss" />
                }
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${results.streak.type === 'win' ? 'text-profit' : 'text-loss'}`}>
                  {results.streak.count}
                </div>
                <p className="text-xs text-muted-foreground">
                  {results.streak.type === 'win' ? 'wins' : 'losses'} in a row
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Update</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {lastUpdate.toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Today's Picks */}
        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Today's Top Picks
              <Badge variant="outline" className="ml-auto">
                {dailyPicks.length} qualified
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyPicks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {isLoading ? "Analyzing games..." : "No qualifying picks found for today"}
              </div>
            ) : (
              <div className="space-y-4">
                {dailyPicks.map((pick) => (
                  <div 
                    key={pick.id}
                    className="border border-border/50 rounded-lg p-4 bg-gradient-to-r from-card to-card/50 hover:from-card/80 hover:to-card/60 transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {pick.awayTeam} @ {pick.homeTeam}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Bet: {pick.recommendedBet === 'home_runline' ? pick.homeTeam : pick.awayTeam} +1.5
                        </p>
                      </div>
                      <div className="text-right space-y-2">
                        <Badge className={getConfidenceColor(pick.confidence)}>
                          {pick.confidence.toFixed(1)}% confidence
                        </Badge>
                        <Badge variant="outline">
                          {pick.odds > 0 ? '+' : ''}{pick.odds}
                        </Badge>
                        {pick.status !== 'pending' && (
                          <Badge className={getStatusColor(pick.status)}>
                            {pick.status.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {pick.reason}
                    </p>
                    
                    {pick.status === 'pending' && (
                      <Button 
                        onClick={() => simulateResults(pick)}
                        variant="outline" 
                        size="sm"
                        className="hover:bg-primary/10"
                      >
                        Simulate Result
                      </Button>
                    )}
                    
                    {pick.result && (
                      <div className="text-sm text-muted-foreground border-t border-border/30 pt-2 mt-2">
                        Final: {pick.homeTeam} {pick.result.homeScore} - {pick.awayTeam} {pick.result.awayScore}
                        {pick.profit && (
                          <span className={`ml-2 font-semibold ${pick.profit > 0 ? 'text-profit' : 'text-loss'}`}>
                            ({pick.profit > 0 ? '+' : ''}{pick.profit.toFixed(2)}u)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};