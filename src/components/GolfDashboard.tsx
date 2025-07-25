import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RefreshCw, TrendingUp, Target, Trophy, MapPin, Calendar, DollarSign, Wind, Thermometer, Cloud, Info, ChevronDown, Clock } from 'lucide-react';
import { GolfAnalysis, GolfPick } from '@/types/golf';
import { GolfAnalysisService } from '@/services/GolfAnalysisService';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSportsMenu } from '@/hooks/useSportsMenu';
import { LiveGolfPerformance } from './LiveGolfPerformance';

export const GolfDashboard = () => {
  const [analysis, setAnalysis] = useState<GolfAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { sportsMenu } = useSportsMenu();

  // Load initial data
  useEffect(() => {
    loadGolfAnalysis();
  }, []);

  const loadGolfAnalysis = async () => {
    setIsLoading(true);
    try {
      const analysisData = await GolfAnalysisService.generateTop10Picks();
      setAnalysis(analysisData);
      setLastUpdate(new Date());
      
      toast({
        title: "Analysis Updated",
        description: `Found ${analysisData?.picks?.length || 0} top 10 candidates`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error loading golf analysis:', error);
      setAnalysis(null); // Ensure analysis is set to null on error
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
            {/* Mobile: Horizontal scroll, Desktop: Centered flex */}
            <div className="overflow-x-auto scrollbar-hide sm:overflow-visible">
              <div className="flex items-center gap-1 sm:gap-2 sm:justify-center min-w-max sm:min-w-0">
                {sportsMenu.map((sport, index) => {
                  const isActive = location.pathname === sport.path;
                  return (
                    <Button
                      key={sport.name}
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className={`flex items-center gap-1 sm:gap-2 rounded-full text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0 ${
                        isActive 
                          ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                          : "hover:bg-muted"
                      }`}
                      onClick={() => {
                        if (sport.path !== '#') {
                          navigate(sport.path);
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
            </div>
          </CardContent>
        </Card>

        {/* Golf Analysis Tabs */}
        <Tabs defaultValue="next-event" className="w-full">
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-6 mb-6">
            {/* Top/Left Section: Logo and Info */}
            <div className="flex flex-col justify-center items-center space-y-3 lg:space-y-4 px-4 lg:px-0">
              <img 
                src="/lovable-uploads/749fb266-2b69-40f1-8720-c5af0940190d.png" 
                alt="Top 10 Tee-Box"
                className="w-64 h-64 object-contain"
              />
              <div className="flex items-center justify-center gap-2 px-2">
                <p className="text-muted-foreground text-center text-xs sm:text-sm lg:text-base leading-relaxed">
                  Golf stat model to identify top 10 finishers
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0 flex-shrink-0">
                      <Info className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto mx-4">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        BetBud.ai Golf Algorithm
                      </DialogTitle>
                      <DialogDescription asChild>
                        <div className="space-y-4 text-sm">
                          <div>
                            <h4 className="font-semibold text-foreground mb-2">How We Pick Winners</h4>
                            <p>Our algorithm analyzes golf tournaments using proven statistical models to identify players with the highest probability of finishing in the top 10.</p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-foreground mb-2">Key Factors</h4>
                            <ul className="space-y-1 list-disc list-inside">
                              <li><strong>Recent Form:</strong> 2+ Top 10s in last 4 starts (60% success rate)</li>
                              <li><strong>Strokes Gained:</strong> Approach play &gt; +0.8 per round critical</li>
                              <li><strong>Course History:</strong> Past performance at venue heavily weighted</li>
                              <li><strong>World Ranking:</strong> OWGR Top 50 players prioritized</li>
                              <li><strong>Weather Adaptation:</strong> Wind specialists favored in tough conditions</li>
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-foreground mb-2">Scorecard Model</h4>
                            <p>Points awarded for recent form, strokes gained metrics, course fit, and world ranking.</p>
                          </div>
                        </div>
                      </DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Top/Right Section: Golf Stats Grid */}
            <div className="grid grid-cols-2 gap-3 lg:gap-4">
              <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 lg:pb-3">
                  <CardTitle className="text-xs lg:text-sm font-medium">Win Rate</CardTitle>
                  <Target className="h-3 w-3 lg:h-4 lg:w-4 text-primary" />
                </CardHeader>
                <CardContent className="py-3 lg:py-4">
                  <div className="text-base lg:text-lg font-bold text-primary">0.0%</div>
                  <p className="text-xs lg:text-sm text-muted-foreground leading-tight">0/0 picks</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 lg:pb-3">
                  <CardTitle className="text-xs lg:text-sm font-medium">Total Winnings</CardTitle>
                  <DollarSign className="h-3 w-3 lg:h-4 lg:w-4 text-profit" />
                </CardHeader>
                <CardContent className="py-3 lg:py-4">
                  <div className="text-base lg:text-lg font-bold text-muted-foreground">$0.00</div>
                  <p className="text-xs lg:text-sm text-muted-foreground leading-tight">Total Wagered: $0.00</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 lg:pb-3">
                  <CardTitle className="text-xs lg:text-sm font-medium">Early Cashout</CardTitle>
                  <Clock className="h-3 w-3 lg:h-4 lg:w-4 text-warning" />
                </CardHeader>
                <CardContent className="py-3 lg:py-4">
                  <div className="text-base lg:text-lg font-bold text-muted-foreground">0.0%</div>
                  <p className="text-xs lg:text-sm text-muted-foreground leading-tight">0/0 rounds</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 lg:pb-3">
                  <CardTitle className="text-xs lg:text-sm font-medium">ROI</CardTitle>
                  <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4 text-profit" />
                </CardHeader>
                <CardContent className="py-3 lg:py-4">
                  <div className="text-base lg:text-lg font-bold text-muted-foreground">0.0%</div>
                  <p className="text-xs lg:text-sm text-muted-foreground leading-tight">Season ROI</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tabs List */}
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="next-event" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Next Event</span>
              <span className="sm:hidden">Next</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Results</span>
              <span className="sm:hidden">Results</span>
            </TabsTrigger>
          </TabsList>

          {/* Next Event Tab */}
          <TabsContent value="next-event" className="space-y-6">
            {/* Tournament Info */}
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <Trophy className="h-5 w-5" />
                  {analysis.tournament.name}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 rounded-full p-0 ml-2">
                        <Info className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto mx-4">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Info className="w-5 h-5 text-primary" />
                          Key Tournament Insights
                        </DialogTitle>
                        <DialogDescription asChild>
                          <div className="space-y-4 text-sm">
                            <div>
                              <h4 className="font-semibold text-foreground mb-2">Tournament Analysis</h4>
                              <div className="space-y-2">
                                {analysis.keyInsights.map((insight, index) => (
                                  <div key={index} className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg">
                                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                                    <p className="text-sm">{insight}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-foreground mb-2">Course Characteristics</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-muted-foreground">Layout</p>
                                  <p className="text-sm">{analysis?.tournament?.courseCharacteristics?.length || 'N/A'} yards, Par {analysis?.tournament?.courseCharacteristics?.parTotal || 'N/A'}</p>
                                   <p className="text-sm">{analysis?.tournament?.courseCharacteristics?.treelined ? 'Tree-lined course' : 'Open layout'}</p>
                                 </div>
                                 <div className="space-y-1">
                                   <p className="text-xs font-medium text-muted-foreground">Playing Conditions</p>
                                   <p className="text-sm">{analysis?.tournament?.courseCharacteristics?.greens || 'N/A'} greens</p>
                                   <p className="text-sm">{analysis?.tournament?.courseCharacteristics?.rough || 'N/A'} rough</p>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold text-foreground mb-2">Weather Impact</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <div className="p-2 bg-muted/30 rounded">
                                  <p className="text-xs font-medium text-muted-foreground">Wind</p>
                                  <p className="text-sm">{analysis.tournament.weatherForecast.wind}</p>
                                </div>
                                <div className="p-2 bg-muted/30 rounded">
                                  <p className="text-xs font-medium text-muted-foreground">Temperature</p>
                                  <p className="text-sm">{analysis.tournament.weatherForecast.temperature}</p>
                                </div>
                                <div className="p-2 bg-muted/30 rounded">
                                  <p className="text-xs font-medium text-muted-foreground">Precipitation</p>
                                  <p className="text-sm">{analysis.tournament.weatherForecast.precipitation}</p>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold text-foreground mb-2">Selection Criteria</h4>
                              <ul className="space-y-1 list-disc list-inside text-sm">
                                <li>Recent form with 2+ top 10s in last 4 starts (60% success rate)</li>
                                <li>Strokes gained approach &gt; +0.8 per round (critical for this course type)</li>
                                <li>Strong wind players favored due to forecast conditions</li>
                                <li>OWGR top 50 players get priority in {analysis.tournament.fieldStrength.toLowerCase()} field</li>
                              </ul>
                            </div>
                          </div>
                        </DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>
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
                      {analysis?.tournament?.courseCharacteristics?.length || 'N/A'} yards, Par {analysis?.tournament?.courseCharacteristics?.parTotal || 'N/A'}
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
                         {analysis?.tournament?.courseCharacteristics?.greens || 'N/A'} greens
                       </p>
                       <p className="text-xs text-gray-600 dark:text-gray-400">
                         {analysis?.tournament?.courseCharacteristics?.rough || 'N/A'} rough
                       </p>
                       <p className="text-xs text-gray-600 dark:text-gray-400">
                         {analysis?.tournament?.courseCharacteristics?.treelined ? 'Tree-lined' : 'Open layout'}
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

            {/* Top 10 Picks - Full Width Cards */}
            <div className="space-y-4">
              {analysis.picks.map((pick, index) => (
                <Card key={pick.id} className="border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                  <div className="p-4 lg:p-6">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 lg:gap-6">
                      {/* Left Side - Player Info */}
                      <div className="flex-1 space-y-3 lg:space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                              #{index + 1} {pick.player.name}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                OWGR #{pick.player.owgr}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                FedEx #{pick.player.fedexCupRank}
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Right Side - Confidence & Odds */}
                          <div className="text-right">
                            <div className={`text-xl font-bold ${getConfidenceColor(pick.confidence)}`}>
                              {pick.confidence.toFixed(0)}%
                            </div>
                            <Badge className={`text-xs ${getConfidenceBadge(pick.top10Probability)}`}>
                              {pick.odds || '+200'} Top 10
                            </Badge>
                          </div>
                        </div>

                        {/* Player Analysis - Buddy Tone */}
                        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2 leading-relaxed">
                          {pick.reason}
                        </div>

                        {/* Key Factors */}
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-full justify-between p-0 h-auto">
                              <span className="text-sm font-medium">Key Factors ({pick?.keyFactors?.length || 0})</span>
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
                            <div className="flex items-start gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Scorecard Points: {pick.scoreCardPoints}</p>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>

                         {(pick?.riskFactors?.length || 0) > 0 && (
                           <Collapsible>
                             <CollapsibleTrigger asChild>
                               <Button variant="ghost" size="sm" className="w-full justify-between p-0 h-auto">
                                 <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                                   Risk Factors ({pick?.riskFactors?.length || 0})
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
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6">
            {analysis && <LiveGolfPerformance picks={analysis.picks} />}
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
};