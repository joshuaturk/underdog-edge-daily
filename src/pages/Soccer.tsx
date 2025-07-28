import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, Target, Trophy, Check, Clock, CloudRain, Sun, Cloud } from 'lucide-react';
import { useSportsMenu } from '@/hooks/useSportsMenu';
import { BTTSAnalysisService } from '@/services/BTTSAnalysisService';
import { BTTSAnalysis, BTTSPick } from '@/types/soccer';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import soccerIcon from '@/assets/soccer-icon.png';

export default function Soccer() {
  const [analysis, setAnalysis] = useState<BTTSAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { sportsMenu } = useSportsMenu();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const loadBTTSAnalysis = async () => {
    try {
      setIsLoading(true);
      console.log('Loading BTTS analysis...');
      
      const bttsAnalysis = await BTTSAnalysisService.getStoredBTTSAnalysis();
      if (bttsAnalysis) {
        setAnalysis(bttsAnalysis);
        setLastUpdate(new Date());
        
        toast({
          title: "BTTS Analysis Loaded", 
          description: `Found ${bttsAnalysis.totalPicks} high-confidence picks (≥80%)`
        });
      } else {
        toast({
          title: "No Analysis Available",
          description: "Unable to load BTTS analysis. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading BTTS analysis:', error);
      toast({
        title: "Error Loading Analysis",
        description: "Failed to fetch BTTS picks. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBTTSAnalysis();
  }, []);

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 90) return 'bg-emerald-500 text-white';
    if (confidence >= 85) return 'bg-green-500 text-white'; 
    if (confidence >= 80) return 'bg-yellow-500 text-black';
    return 'bg-blue-500 text-white';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'won': return 'bg-profit text-white';
      case 'lost': return 'bg-loss text-white';
      case 'live': return 'bg-accent text-white';
      case 'pending': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getWeatherIcon = (conditions: string) => {
    const lower = conditions.toLowerCase();
    if (lower.includes('rain') || lower.includes('shower')) return <CloudRain className="w-4 h-4 text-blue-500" />;
    if (lower.includes('cloud') || lower.includes('overcast')) return <Cloud className="w-4 h-4 text-gray-500" />;
    return <Sun className="w-4 h-4 text-yellow-500" />;
  };

  const formatKickoffTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    });
  };

  const getETTime = (): string => {
    return new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'America/New_York'
    });
  };

  // Filter picks by status for Results tab
  const resultsPicks = analysis?.picks.filter(pick => 
    pick.homeTeam && pick.awayTeam && (
      // Has live scores or completed status
      (pick as any).result || (pick as any).status !== 'pending'
    )
  ) || [];

  const upcomingPicks = analysis?.picks.filter(pick => 
    pick.homeTeam && pick.awayTeam && !(pick as any).result && (pick as any).status === 'pending'
  ) || [];

  if (isLoading && !analysis) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading BTTS Analysis...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-4 lg:py-6">
        
        {/* Header Section - Matching MLB Layout */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6 mb-6">
          <div className="flex items-center gap-3 lg:gap-4">
            <img src={soccerIcon} alt="Soccer" className="w-10 h-10 lg:w-12 lg:h-12" />
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Soccer BTTS Picks</h1>
              <p className="text-sm lg:text-base text-muted-foreground">
                High-confidence Both Teams To Score predictions (≥80%)
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="text-right hidden lg:block">
              <div className="text-sm font-medium text-foreground">Last Updated</div>
              <div className="text-xs text-muted-foreground">{getETTime()} ET</div>
            </div>
            <Button 
              onClick={loadBTTSAnalysis}
              disabled={isLoading}
              className="flex items-center gap-2"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <ThemeToggle />
          </div>
        </div>

        {/* Sports Navigation - Matching MLB Layout */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 p-2 bg-muted rounded-lg">
            {sportsMenu.map((sport) => (
              <Button
                key={sport.name}
                variant={location.pathname === sport.path ? "default" : "ghost"}
                size="sm"
                className="flex items-center gap-2"
                onClick={() => sport.path !== '#' && navigate(sport.path)}
                disabled={sport.path === '#'}
              >
                <span>{sport.symbol}</span>
                <span className="hidden sm:inline">{sport.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Analysis Overview Cards - Matching MLB Layout */}
        {analysis && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Total Picks</span>
                </div>
                <p className="text-2xl font-bold">{analysis.totalPicks}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Avg. Confidence</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{analysis.averageConfidence}%</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">Threshold</span>
                </div>
                <p className="text-2xl font-bold">≥80%</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Last Updated</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {lastUpdate.toLocaleTimeString('en-GB', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content with Tabs - Matching MLB Layout */}
        <Tabs defaultValue="picks" className="w-full">
          <div className="flex justify-center mb-4 lg:mb-6">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-muted p-1">
              <TabsTrigger value="picks" className="flex items-center gap-2">
                <span className="font-medium">Picks</span>
                <Badge variant="outline" className="text-xs h-5 px-1.5">
                  {upcomingPicks.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="results" className="flex items-center gap-2">
                <span className="font-medium">Results</span>
                <Badge variant="outline" className="text-xs h-5 px-1.5">
                  {resultsPicks.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
            <CardContent className="p-4 lg:p-6">
              
              {/* Picks Tab */}
              <TabsContent value="picks" className="mt-0">
                {upcomingPicks.length === 0 ? (
                  <div className="text-center py-8 lg:py-12 text-muted-foreground">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <div className="text-base lg:text-lg mb-2">
                      {isLoading ? "Analyzing matches..." : "No qualifying picks found"}
                    </div>
                    {!isLoading && (
                      <div className="text-sm">Check back later for high-confidence BTTS picks (≥80%)</div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 lg:space-y-6">
                    {upcomingPicks.map((pick) => (
                      <div 
                        key={pick.id}
                        className="border border-border/50 rounded-lg p-4 lg:p-6 bg-gradient-to-r from-card to-card/50 hover:from-card/80 hover:to-card/60 transition-all duration-300"
                      >
                        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-4 lg:mb-6 gap-4 lg:gap-6">
                          <div className="flex-1 space-y-3 lg:space-y-4">
                            
                            {/* Away Team */}
                            <div className="flex items-center gap-3 lg:gap-4">
                              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-xs lg:text-sm font-semibold">A</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 lg:gap-3">
                                  <div className="font-semibold text-base lg:text-lg truncate">{pick.awayTeam}</div>
                                  {(pick as any).result && (
                                    <span className="text-xl lg:text-2xl font-bold">{(pick as any).result.awayScore}</span>
                                  )}
                                </div>
                                <div className="text-sm lg:text-base text-muted-foreground">
                                  BTTS Rate: {(pick.awayTeamRate * 100).toFixed(1)}%
                                </div>
                              </div>
                            </div>
                           
                            {/* Home Team */}
                            <div className="flex items-center gap-3 lg:gap-4">
                              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-xs lg:text-sm font-semibold">H</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 lg:gap-3">
                                  <div className="font-semibold text-base lg:text-lg truncate">{pick.homeTeam}</div>
                                  {(pick as any).result && (
                                    <span className="text-xl lg:text-2xl font-bold">{(pick as any).result.homeScore}</span>
                                  )}
                                </div>
                                <div className="text-sm lg:text-base text-muted-foreground">
                                  BTTS Rate: {(pick.homeTeamRate * 100).toFixed(1)}%
                                </div>
                              </div>
                            </div>

                            {/* League and Match Info */}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground border-t border-border/30 pt-3">
                              <Badge variant="outline" className="text-xs">
                                {pick.league}
                              </Badge>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatKickoffTime(pick.kickoffTime)} • {formatDate(pick.date)}
                              </div>
                              {pick.weather && (
                                <div className="flex items-center gap-1">
                                  {getWeatherIcon(pick.weather.conditions)}
                                  <span>{pick.weather.temperature} • {pick.weather.conditions}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Right Side Stats */}
                          <div className="lg:text-right space-y-3 lg:space-y-2 lg:ml-6 mt-4 lg:mt-0">
                            <div className="flex flex-row lg:flex-col items-center lg:items-end gap-3 lg:gap-2">
                              <Badge className={`${getConfidenceColor(pick.confidence)} px-3 py-2 lg:px-2 lg:py-1`}>
                                <span className="text-lg lg:text-base font-bold">{pick.confidence}%</span>
                              </Badge>
                              <div className="text-base lg:text-sm font-medium text-muted-foreground">
                                BTTS
                              </div>
                            </div>
                            <div className="flex flex-row lg:flex-col items-center lg:items-end gap-3 lg:gap-2">
                              <div className="text-sm text-muted-foreground">
                                Value: {pick.valueRating > 0 ? '+' : ''}{pick.valueRating.toFixed(1)}%
                              </div>
                              {(pick as any).status && (pick as any).status !== 'pending' && (
                                <Badge className={`${getStatusColor((pick as any).status)} px-3 py-1.5 lg:px-2 lg:py-1`}>
                                  {(pick as any).status.toUpperCase()}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Results Tab */}
              <TabsContent value="results" className="mt-0">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-primary" />
                      All Tracked Picks
                    </h3>
                    
                    {resultsPicks.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <h4 className="text-lg font-medium mb-2">No results yet</h4>
                        <p>BTTS pick results will appear here as matches complete</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {resultsPicks.map((pick, index) => (
                          <div 
                            key={`${pick.homeTeam}-${pick.awayTeam}-${pick.date}-${index}`}
                            className={`border border-border/50 rounded-lg p-4 bg-gradient-to-r transition-all duration-300 ${
                              (pick as any).status === 'pending' 
                                ? 'from-accent/5 to-accent/10 border-accent/20' 
                                : (pick as any).status === 'won'
                                ? 'from-profit/5 to-profit/10 border-profit/20'
                                : (pick as any).status === 'lost'
                                ? 'from-loss/5 to-loss/10 border-loss/20'
                                : 'from-card to-card/50'
                            }`}
                          >
                            <div className="space-y-3 sm:space-y-0 sm:flex sm:justify-between sm:items-start">
                              
                              {/* Game Info Section */}
                              <div className="flex-1 space-y-2">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <Badge className={`${getStatusColor((pick as any).status || 'pending')} text-xs`}>
                                      {((pick as any).status || 'PENDING').toUpperCase()}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {pick.league}
                                    </Badge>
                                    {(pick as any).status === 'pending' && (pick as any).result && (
                                      <span className="text-xs text-accent font-medium px-2 py-1 bg-accent/10 rounded">LIVE</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {format(new Date(pick.date), 'MMM d, yyyy')}
                                  </div>
                                </div>

                                {/* Teams and Scores */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-1">
                                      <div className="w-5 h-5 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs font-semibold">A</span>
                                      </div>
                                      <span className="font-medium text-sm sm:text-base truncate">{pick.awayTeam}</span>
                                    </div>
                                    {(pick as any).result && (
                                      <span className="text-lg font-bold ml-2">{(pick as any).result.awayScore}</span>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-1">
                                      <div className="w-5 h-5 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs font-semibold">H</span>
                                      </div>
                                      <span className="font-medium text-sm sm:text-base truncate">{pick.homeTeam}</span>
                                    </div>
                                    {(pick as any).result && (
                                      <span className="text-lg font-bold ml-2">{(pick as any).result.homeScore}</span>
                                    )}
                                  </div>
                                </div>

                                {/* Final Result */}
                                {(pick as any).result && (
                                  <div className="text-sm text-muted-foreground border-t border-border/30 pt-2 mt-2">
                                    Final: {pick.homeTeam} {(pick as any).result.homeScore} - {pick.awayTeam} {(pick as any).result.awayScore}
                                    {(pick as any).profit !== undefined && (
                                      <span className={`ml-2 font-semibold ${(pick as any).profit >= 0 ? 'text-profit' : 'text-loss'}`}>
                                        ({(pick as any).profit >= 0 ? '+' : ''}${(pick as any).profit.toFixed(2)})
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Right Side Stats */}
                              <div className="text-right sm:ml-4">
                                <Badge className={`${getConfidenceColor(pick.confidence)} text-xs mb-1`}>
                                  {pick.confidence}% BTTS
                                </Badge>
                                <div className="text-xs text-muted-foreground">
                                  Value: {pick.valueRating > 0 ? '+' : ''}{pick.valueRating.toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </div>
  );
}