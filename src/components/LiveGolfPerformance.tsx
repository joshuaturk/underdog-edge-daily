import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Trophy, TrendingUp, TrendingDown, Target, Clock } from 'lucide-react';
import { GolfPick } from '@/types/golf';
import { GolfAnalysisService } from '@/services/GolfAnalysisService';
import { useToast } from '@/hooks/use-toast';

interface LiveGolfPerformanceProps {
  picks: GolfPick[];
}

export const LiveGolfPerformance = ({ picks }: LiveGolfPerformanceProps) => {
  const [liveScores, setLiveScores] = useState<GolfPick[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { toast } = useToast();

  useEffect(() => {
    fetchLiveScores();
    // Auto refresh every 5 minutes
    const interval = setInterval(fetchLiveScores, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [picks]);

  const fetchLiveScores = async () => {
    setIsLoading(true);
    try {
      const updatedPicks = await GolfAnalysisService.fetchLiveScores(picks);
      setLiveScores(updatedPicks);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching live scores:', error);
      toast({
        title: "Error",
        description: "Failed to fetch live scores",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string, isTop10: boolean) => {
    if (status === 'CUT') {
      return <Badge variant="destructive">CUT</Badge>;
    }
    if (status === 'WON' || isTop10) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">WON</Badge>;
    }
    if (status === 'LOST') {
      return <Badge variant="destructive">LOST</Badge>;
    }
    return <Badge variant="secondary">ACTIVE</Badge>;
  };

  const getPositionChange = (currentPos: number) => {
    // Mock position change for demo - in real implementation this would track position history
    const change = Math.floor(Math.random() * 6) - 3; // Random -3 to +3
    if (change > 0) {
      return <span className="text-red-500 flex items-center"><TrendingDown className="h-3 w-3 mr-1" />+{change}</span>;
    } else if (change < 0) {
      return <span className="text-green-500 flex items-center"><TrendingUp className="h-3 w-3 mr-1" />{change}</span>;
    }
    return <span className="text-muted-foreground">-</span>;
  };

  const wonCount = liveScores.filter(pick => pick.player.liveScore?.isWinner || pick.player.liveScore?.status === 'WON').length;
  const lostCount = liveScores.filter(pick => pick.player.liveScore?.status === 'LOST' || pick.player.liveScore?.status === 'CUT').length;
  const activeCount = liveScores.filter(pick => pick.player.liveScore?.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Won</CardTitle>
            <Trophy className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{wonCount}</div>
            <p className="text-xs text-green-800 dark:text-green-200">Top 10 finishes</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lost</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{lostCount}</div>
            <p className="text-xs text-red-800 dark:text-red-200">Outside top 10</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{activeCount}</div>
            <p className="text-xs text-blue-800 dark:text-blue-200">In play</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hit Rate</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {liveScores.length > 0 ? Math.round((wonCount / liveScores.length) * 100) : 0}%
            </div>
            <p className="text-xs text-purple-800 dark:text-purple-200">Success rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Live Leaderboard */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Live Algorithm Performance
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
            <Button
              onClick={fetchLiveScores}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-center">Position</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="text-center">Thru</TableHead>
                  <TableHead className="text-center">Movement</TableHead>
                  <TableHead className="text-center">Confidence</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liveScores.map((pick) => (
                  <TableRow key={pick.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{pick.player.name}</div>
                        <div className="text-xs text-muted-foreground">
                          OWGR #{pick.player.owgr} • {pick.odds || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="font-bold text-lg">
                        {pick.player.liveScore?.currentPosition ? `T${pick.player.liveScore.currentPosition}` : '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="font-mono">
                        {pick.player.liveScore?.totalScore !== undefined 
                          ? pick.player.liveScore.totalScore > 0 
                            ? `+${pick.player.liveScore.totalScore}`
                            : pick.player.liveScore.totalScore.toString()
                          : 'E'
                        }
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="text-sm">
                        {pick.player.liveScore?.thru !== undefined 
                          ? pick.player.liveScore.currentRound === 4 
                            ? 'F'
                            : `${pick.player.liveScore.thru}`
                          : '-'
                        }
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {pick.player.liveScore?.currentPosition ? getPositionChange(pick.player.liveScore.currentPosition) : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs">
                        {pick.confidence}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(
                        pick.player.liveScore?.status || 'ACTIVE',
                        pick.player.liveScore?.isWinner || false
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Round by Round Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Round by Round Scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-center">R1</TableHead>
                  <TableHead className="text-center">R2</TableHead>
                  <TableHead className="text-center">R3</TableHead>
                  <TableHead className="text-center">R4</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liveScores.map((pick) => (
                  <TableRow key={pick.id}>
                    <TableCell className="font-medium">{pick.player.name}</TableCell>
                    <TableCell className="text-center font-mono">
                      {pick.player.liveScore?.rounds[0] || '-'}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {pick.player.liveScore?.rounds[1] || '-'}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {pick.player.liveScore?.rounds[2] || '-'}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {pick.player.liveScore?.rounds[3] || '-'}
                    </TableCell>
                    <TableCell className="text-center font-mono font-bold">
                      {pick.player.liveScore?.totalScore !== undefined 
                        ? pick.player.liveScore.totalScore > 0 
                          ? `+${pick.player.liveScore.totalScore}`
                          : pick.player.liveScore.totalScore.toString()
                        : 'E'
                      }
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(
                        pick.player.liveScore?.status || 'ACTIVE',
                        pick.player.liveScore?.isWinner || false
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};