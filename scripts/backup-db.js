const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const backupDir = path.join(__dirname, '../backups');

// Crear directorio de backups si no existe
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);

const command = `docker exec nexodash-postgres-1 pg_dump -U nexodash -d nexodash > "${backupFile}"`;

console.log('🔄 Creating database backup...');
console.log(`📁 Backup file: ${backupFile}`);

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Backup failed:', error);
    return;
  }
  
  if (stderr) {
    console.error('⚠️ Warning:', stderr);
  }
  
  const stats = fs.statSync(backupFile);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log('✅ Backup completed successfully!');
  console.log(`📊 File size: ${fileSizeInMB} MB`);
  console.log(`📍 Location: ${backupFile}`);
  
  // Mantener solo los últimos 5 backups
  const files = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('backup-') && f.endsWith('.sql'))
    .map(f => ({
      name: f,
      path: path.join(backupDir, f),
      time: fs.statSync(path.join(backupDir, f)).mtime
    }))
    .sort((a, b) => b.time - a.time);
  
  if (files.length > 5) {
    files.slice(5).forEach(file => {
      fs.unlinkSync(file.path);
      console.log(`🗑️ Deleted old backup: ${file.name}`);
    });
  }
});
