import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATS_FILE = path.join(__dirname, 'unstop-stats.json');

async function syncAivoraStats() {
  try {
    const stats = {
      competitionId: 1767244,
      title: 'AIVORA 2K26',
      format: 'Online',
      participation: 'Individual / Team',
      status: 'REGISTRATION_OPEN',
      organisation: 'Innovation Hacks',
      registrationDeadline: '2026',
      unstopUrl: 'https://unstop.com/p/aivora-2k26-innovation-hacks-1767244',
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8');
    return stats;
  } catch (err) {
    console.error(`[${new Date().toLocaleTimeString()}] Error syncing stats:`, err.message);
  }
  return null;
}

// Initial sync
syncAivoraStats();
