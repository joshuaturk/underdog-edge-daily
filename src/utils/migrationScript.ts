import { ProductionDataService } from '@/services/ProductionDataService';
import { BettingPick } from '@/types/betting';

/**
 * Migration script to restore lost "Won" picks and merge them back into the database
 */
export class PicksMigrationScript {
  
  /**
   * Migrate local storage picks to database
   */
  static async migrateLocalStorageToDatabase(): Promise<{ success: boolean; migrated: number; error?: string }> {
    try {
      console.log('=== MIGRATION: Local Storage to Database ===');
      
      // Get picks from localStorage (if any exist)
      const savedData = localStorage.getItem('accumulatedPicksData');
      if (!savedData) {
        console.log('No local storage data found');
        return { success: true, migrated: 0 };
      }
      
      const pickData = JSON.parse(savedData);
      const localPicks: BettingPick[] = pickData.picks || [];
      
      if (localPicks.length === 0) {
        console.log('No picks found in local storage');
        return { success: true, migrated: 0 };
      }
      
      console.log(`Found ${localPicks.length} picks in local storage`);
      
      // Filter for completed picks (won, lost, push)
      const completedPicks = localPicks.filter(pick => 
        pick.status === 'won' || pick.status === 'lost' || pick.status === 'push'
      );
      
      console.log(`Found ${completedPicks.length} completed picks to migrate`);
      
      if (completedPicks.length === 0) {
        return { success: true, migrated: 0 };
      }
      
      // Save to database using bulk insert
      const result = await ProductionDataService.saveBulkPicks(completedPicks);
      
      if (result.success) {
        console.log(`Successfully migrated ${completedPicks.length} picks to database`);
        return { success: true, migrated: completedPicks.length };
      } else {
        console.error('Failed to migrate picks:', result.error);
        return { success: false, migrated: 0, error: result.error };
      }
      
    } catch (error) {
      console.error('Migration error:', error);
      return { 
        success: false, 
        migrated: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * Restore won picks from a backup source
   * This would typically read from a backup table or file
   */
  static async restoreWonPicksFromBackup(): Promise<{ success: boolean; restored: number; error?: string }> {
    try {
      console.log('=== MIGRATION: Restore Won Picks ===');
      
      // In a real implementation, you would:
      // 1. Query your backup/archive table for won picks
      // 2. Filter for picks that are missing from the main table
      // 3. Insert them back using saveBulkPicks
      
      // For now, we'll try to restore from localStorage as a fallback
      const migrationResult = await this.migrateLocalStorageToDatabase();
      
      if (migrationResult.success) {
        const wonPicksCount = migrationResult.migrated;
        console.log(`Restored ${wonPicksCount} picks from local backup`);
        return { success: true, restored: wonPicksCount };
      } else {
        return { 
          success: false, 
          restored: 0, 
          error: migrationResult.error || 'Failed to restore from backup' 
        };
      }
      
    } catch (error) {
      console.error('Restore error:', error);
      return { 
        success: false, 
        restored: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * Full migration process: restore lost picks and sync to database
   */
  static async runFullMigration(): Promise<{ 
    success: boolean; 
    localMigrated: number; 
    backupRestored: number; 
    error?: string 
  }> {
    try {
      console.log('=== FULL MIGRATION PROCESS ===');
      
      // Step 1: Migrate local storage to database
      const localResult = await this.migrateLocalStorageToDatabase();
      
      // Step 2: Restore from backup (if available)
      const backupResult = await this.restoreWonPicksFromBackup();
      
      const success = localResult.success && backupResult.success;
      const error = localResult.error || backupResult.error;
      
      console.log(`Migration complete - Local: ${localResult.migrated}, Backup: ${backupResult.restored}`);
      
      return {
        success,
        localMigrated: localResult.migrated,
        backupRestored: backupResult.restored,
        error
      };
      
    } catch (error) {
      console.error('Full migration error:', error);
      return {
        success: false,
        localMigrated: 0,
        backupRestored: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}