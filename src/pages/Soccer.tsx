import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, Target, Clock } from 'lucide-react';
import { useSportsMenu } from '@/hooks/useSportsMenu';
import { useNavigate } from 'react-router-dom';
import { BTTSAnalysisService } from '@/services/BTTSAnalysisService';
import { BTTSAnalysis, BTTSPick } from '@/types/soccer';
import { useToast } from '@/hooks/use-toast';
import soccerIcon from '@/assets/soccer-icon.png';

export default function Soccer() {
  const [analysis, setAnalysis] = useState<BTTSAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { sportsMenu } = useSportsMenu();
  const navigate = useNavigate();
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
          description: `Found ${bttsAnalysis.totalPicks} high-confidence picks`
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
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600'; 
    return 'text-blue-600';
  };

  const getConfidenceBadge = (confidence: number): string => {
    if (confidence >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (confidence >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const formatKickoffTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupPicksByLeague = (picks: BTTSPick[]) => {
    return picks.reduce((groups, pick) => {
      const league = pick.league;
      if (!groups[league]) {
        groups[league] = [];
      }
      groups[league].push(pick);
      return groups;
    }, {} as Record<string, BTTSPick[]>);
  };

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
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <img src={soccerIcon} alt="Soccer" className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Soccer BTTS Picks</h1>
              <p className="text-muted-foreground">Both Teams To Score predictions using recency-weighted analysis</p>
            </div>
          </div>
          <Button 
            onClick={loadBTTSAnalysis}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Analysis
          </Button>
        </div>

        {/* Sports Navigation */}
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

        {/* Analysis Overview */}
        {analysis && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                  <span className="text-sm font-medium">PL Gameweek</span>
                </div>
                <p className="text-2xl font-bold">{analysis.currentGameweek.premierLeague}</p>
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

        {/* BTTS Picks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              High-Confidence BTTS Picks (≥65%)
            </CardTitle>
            <CardDescription>
              Picks are ranked by confidence using recency-weighted team BTTS rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analysis && analysis.picks.length > 0 ? (
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All Leagues</TabsTrigger>
                  <TabsTrigger value="premier-league">Premier League</TabsTrigger>
                  <TabsTrigger value="championship">Championship</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="space-y-4 mt-4">
                  {Object.entries(groupPicksByLeague(analysis.picks)).map(([league, picks]) => (
                    <div key={league}>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        {league}
                        <Badge variant="outline">{picks.length} picks</Badge>
                      </h3>
                      <div className="space-y-3">
                        {picks.map((pick) => (
                          <Card key={pick.id} className="border-l-4 border-l-primary">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className="font-semibold text-lg">
                                      {pick.homeTeam} vs {pick.awayTeam}
                                    </span>
                                    <Badge className={getConfidenceBadge(pick.confidence)}>
                                      {pick.confidence}% BTTS
                                    </Badge>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                                    <div>
                                      <span className="font-medium">{pick.homeTeam} BTTS Rate:</span> {(pick.homeTeamRate * 100).toFixed(1)}%
                                    </div>
                                    <div>
                                      <span className="font-medium">{pick.awayTeam} BTTS Rate:</span> {(pick.awayTeamRate * 100).toFixed(1)}%
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="text-right">
                                  <div className={`text-xl font-bold ${getConfidenceColor(pick.confidence)}`}>
                                    {pick.confidence}%
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {formatKickoffTime(pick.kickoffTime)}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="premier-league" className="space-y-3 mt-4">
                  {analysis.picks.filter(p => p.league === 'Premier League').map((pick) => (
                    <Card key={pick.id} className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-semibold text-lg">
                                {pick.homeTeam} vs {pick.awayTeam}
                              </span>
                              <Badge className={getConfidenceBadge(pick.confidence)}>
                                {pick.confidence}% BTTS
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                              <div>
                                <span className="font-medium">{pick.homeTeam} BTTS Rate:</span> {(pick.homeTeamRate * 100).toFixed(1)}%
                              </div>
                              <div>
                                <span className="font-medium">{pick.awayTeam} BTTS Rate:</span> {(pick.awayTeamRate * 100).toFixed(1)}%
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className={`text-xl font-bold ${getConfidenceColor(pick.confidence)}`}>
                              {pick.confidence}%
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatKickoffTime(pick.kickoffTime)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="championship" className="space-y-3 mt-4">
                  {analysis.picks.filter(p => p.league === 'Championship').map((pick) => (
                    <Card key={pick.id} className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-semibold text-lg">
                                {pick.homeTeam} vs {pick.awayTeam}
                              </span>
                              <Badge className={getConfidenceBadge(pick.confidence)}>
                                {pick.confidence}% BTTS
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                              <div>
                                <span className="font-medium">{pick.homeTeam} BTTS Rate:</span> {(pick.homeTeamRate * 100).toFixed(1)}%
                              </div>
                              <div>
                                <span className="font-medium">{pick.awayTeam} BTTS Rate:</span> {(pick.awayTeamRate * 100).toFixed(1)}%
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className={`text-xl font-bold ${getConfidenceColor(pick.confidence)}`}>
                              {pick.confidence}%
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatKickoffTime(pick.kickoffTime)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No high-confidence BTTS picks available for current gameweek</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Picks require ≥65% confidence based on recent team performance
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}