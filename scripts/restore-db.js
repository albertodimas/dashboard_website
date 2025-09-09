const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const backupDir = path.join(__dirname, '../backups');

// Verificar que existe el directorio de backups
if (!fs.existsSync(backupDir)) {
  console.error('❌ No backup directory found');
  process.exit(1);
}

// Listar backups disponibles
const backups = fs.readdirSync(backupDir)
  .filter(f => f.startsWith('backup-') && f.endsWith('.sql'))
  .map(f => ({
    name: f,
    path: path.join(backupDir, f),
    time: fs.statSync(path.join(backupDir, f)).mtime,
    size: (fs.statSync(path.join(backupDir, f)).size / (1024 * 1024)).toFixed(2)
  }))
  .sort((a, b) => b.time - a.time);

if (backups.length === 0) {
  console.error('❌ No backups found');
  process.exit(1);
}

console.log('📋 Available backups:');
backups.forEach((backup, index) => {
  const date = backup.time.toLocaleString();
  console.log(`${index + 1}. ${backup.name} (${backup.size} MB) - ${date}`);
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('\n📝 Enter the number of the backup to restore (or "q" to quit): ', (answer) => {
  if (answer.toLowerCase() === 'q') {
    console.log('👋 Restoration cancelled');
    rl.close();
    process.exit(0);
  }

  const index = parseInt(answer) - 1;
  if (isNaN(index) || index < 0 || index >= backups.length) {
    console.error('❌ Invalid selection');
    rl.close();
    process.exit(1);
  }

  const selectedBackup = backups[index];
  
  rl.question('\n⚠️  WARNING: This will replace all current data. Continue? (yes/no): ', (confirm) => {
    if (confirm.toLowerCase() !== 'yes') {
      console.log('👋 Restoration cancelled');
      rl.close();
      process.exit(0);
    }

    console.log(`\n🔄 Restoring from: ${selectedBackup.name}`);
    
    // First, clean the database
    const cleanCommand = `docker exec dashboard_website-postgres-1 psql -U dashboard -d dashboard -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`;
    
    exec(cleanCommand, (error) => {
      if (error) {
        console.error('❌ Failed to clean database:', error);
        rl.close();
        process.exit(1);
      }
      
      // Then restore from backup
      const restoreCommand = `docker exec -i dashboard_website-postgres-1 psql -U dashboard -d dashboard < "${selectedBackup.path}"`;
      
      exec(restoreCommand, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Restore failed:', error);
          rl.close();
          process.exit(1);
        }
        
        if (stderr) {
          console.log('⚠️ Warnings during restore:', stderr);
        }
        
        console.log('✅ Database restored successfully!');
        console.log('🔄 Please restart your application servers');
        rl.close();
      });
    });
  });
});