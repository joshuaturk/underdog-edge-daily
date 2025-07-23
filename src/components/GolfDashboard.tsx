import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RefreshCw, TrendingUp, Target, Trophy, MapPin, Calendar, DollarSign, Wind, Thermometer, Cloud, Info, ChevronDown } from 'lucide-react';
import { GolfAnalysis, GolfPick } from '@/types/golf';
import { GolfAnalysisService } from '@/services/GolfAnalysisService';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Sports navigation data with consistent Unicode symbols as backup
const sportsMenu = [
  { name: 'MLB', symbol: '⚾', active: true, path: '/' },
  { name: 'NCAA Football', symbol: '🏈', path: '#' },
  { name: 'NCAA Bball', symbol: '🏀', path: '#' },
  { name: 'NHL', symbol: '🏒', path: '#' },
  { name: 'NBA', symbol: '🏀', path: '#' },
  { name: 'NFL', symbol: '🏈', path: '#' },
  { name: 'Soccer', symbol: '⚽', path: '#' },
  { name: 'Golf', symbol: '⛳', path: '/golf' },
  { name: 'Tennis', symbol: '🎾', path: '#' }
];

export const GolfDashboard = () => {
  const [analysis, setAnalysis] = useState<GolfAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    loadGolfAnalysis();
  }, []);

  const loadGolfAnalysis = async () => {
    setIsLoading(true);
    try {
      const analysisData = GolfAnalysisService.generateTop10Picks();
      setAnalysis(analysisData);
      setLastUpdate(new Date());
      
      toast({
        title: "Analysis Updated",
        description: `Found ${analysisData.picks.length} top 10 candidates`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error loading golf analysis:', error);
      toast({
        title: "Error",
        description: "Failed to load golf analysis",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 75) return 'text-green-600 dark:text-green-400';
    if (confidence >= 65) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 75) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (confidence >= 65) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading golf analysis...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-accent/5">
      <div className="container mx-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* Header - Mobile optimized */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 lg:gap-6">
          <div className="flex items-center gap-3 justify-center lg:justify-start">
            <div className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/db562826-74b8-4870-8f78-da45d663e372.png" 
                alt="betbud.ai"
                className="h-10 lg:h-12 object-contain"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 justify-center lg:justify-end flex-wrap">
            <Button
              onClick={loadGolfAnalysis}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="px-3 py-2 h-9"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-1 lg:mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1 lg:mr-2" />
              )}
              <span className="hidden lg:inline">Refresh Data</span>
              <span className="lg:hidden">Refresh</span>
            </Button>
            <ThemeToggle />
          </div>
        </div>

        {/* Sports Navigation Menu */}
        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 rounded-full">
          <CardContent className="p-2 sm:p-4">
            <div className="flex items-center justify-center gap-1 flex-wrap">
              {sportsMenu.map((sport, index) => {
                const isActive = sport.path === '/golf';
                return (
                  <Button
                    key={sport.name}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={`flex items-center gap-1 sm:gap-2 rounded-full text-xs sm:text-sm px-2 sm:px-3 ${
                      isActive 
                        ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                        : "hover:bg-muted"
                    }`}
                    onClick={() => {
                      if (sport.path !== '#') {
                        // Navigation logic would go here
                        window.location.href = sport.path;
                      }
                    }}
                    disabled={sport.path === '#'}
                  >
                    <span className="text-sm sm:text-base" style={{ fontFamily: 'Apple Color Emoji, Segoe UI Emoji, sans-serif' }}>
                      {sport.symbol}
                    </span>
                    <span className="hidden sm:inline">{sport.name}</span>
                    <span className="sm:hidden">{sport.name.split(' ')[0]}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tournament Info */}
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <Trophy className="h-5 w-5" />
              {analysis.tournament.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                  <MapPin className="h-4 w-4" />
                  Course Info
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">{analysis.tournament.course}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{analysis.tournament.location}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {analysis.tournament.courseCharacteristics.length} yards, Par {analysis.tournament.courseCharacteristics.parTotal}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                  <Calendar className="h-4 w-4" />
                  Tournament Details
                </div>
                <p className="text-sm text-gray-900 dark:text-white">{analysis.tournament.dates}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{analysis.tournament.purse}</p>
                <Badge className={`text-xs ${
                  analysis.tournament.fieldStrength === 'Elite' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                  analysis.tournament.fieldStrength === 'Strong' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  {analysis.tournament.fieldStrength} Field
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                  <Wind className="h-4 w-4" />
                  Course Character
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {analysis.tournament.courseCharacteristics.greens} greens
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {analysis.tournament.courseCharacteristics.rough} rough
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {analysis.tournament.courseCharacteristics.treelined ? 'Tree-lined' : 'Open layout'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                  <Cloud className="h-4 w-4" />
                  Weather Forecast
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Wind: {analysis.tournament.weatherForecast.wind}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Temp: {analysis.tournament.weatherForecast.temperature}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Rain: {analysis.tournament.weatherForecast.precipitation}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Insights */}
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <Info className="h-5 w-5" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysis.keyInsights.map((insight, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-blue-900 dark:text-blue-100">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top 10 Picks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {analysis.picks.map((pick, index) => (
            <Card key={pick.id} className="border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                      #{index + 1} {pick.player.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        OWGR #{pick.player.owgr}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        FedEx #{pick.player.fedexCupRank}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${getConfidenceColor(pick.confidence)}`}>
                      {pick.confidence.toFixed(0)}%
                    </div>
                    <Badge className={`text-xs ${getConfidenceBadge(pick.confidence)}`}>
                      {pick.scoreCardPoints} pts
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {pick.reason}
                  </p>
                  
                  {/* Recent Form */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Recent Form</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {pick.player.recentForm.top10sLast4Starts}/4 Top 10s
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Last: {pick.player.recentForm.lastStartResult}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Strokes Gained</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        +{pick.player.recentForm.sgTotalLast3.toFixed(1)} Total
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        +{pick.player.recentForm.sgApproachLast3.toFixed(1)} Approach
                      </p>
                    </div>
                  </div>

                  {/* Key Factors */}
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between p-0 h-auto">
                        <span className="text-sm font-medium">Key Factors ({pick.keyFactors.length})</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 mt-2">
                      {pick.keyFactors.map((factor, factorIndex) => (
                        <div key={factorIndex} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                          <p className="text-xs text-gray-600 dark:text-gray-400">{factor}</p>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>

                  {pick.riskFactors.length > 0 && (
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full justify-between p-0 h-auto">
                          <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                            Risk Factors ({pick.riskFactors.length})
                          </span>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-2 mt-2">
                        {pick.riskFactors.map((risk, riskIndex) => (
                          <div key={riskIndex} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                            <p className="text-xs text-orange-600 dark:text-orange-400">{risk}</p>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Analysis Summary */}
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
              <Target className="h-5 w-5" />
              Analysis Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                  {analysis.picks.length}
                </div>
                <p className="text-sm text-purple-800 dark:text-purple-200">Qualified Players</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {Math.round(analysis.picks.reduce((sum, pick) => sum + pick.confidence, 0) / analysis.picks.length)}%
                </div>
                <p className="text-sm text-green-800 dark:text-green-200">Avg Confidence</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {analysis.confidence}
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-200">Overall Rating</p>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Last updated: {lastUpdate.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};