#!/usr/bin/env node
/**
 * Script de test pour valider le MCP Server FileWatcher
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_DIR = '/tmp/skynet-test-watch';
const LOG_FILE = path.join(__dirname, 'logs/events.jsonl');

console.log('🧪 Test du MCP Server FileWatcher\n');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function readEvents() {
  try {
    const content = await fs.readFile(LOG_FILE, 'utf-8');
    return content.trim().split('\n').filter(line => line).map(line => JSON.parse(line));
  } catch (error) {
    return [];
  }
}

async function testFileOperations() {
  console.log('📝 Test 1: Création de fichier');
  await fs.writeFile(path.join(TEST_DIR, 'test1.txt'), 'Hello World');
  await sleep(3000);

  let events = await readEvents();
  const createEvent = events.find(e => e.file_path.includes('test1.txt') && e.event_type === 'created');
  if (createEvent) {
    console.log('✅ Événement de création détecté');
    console.log(`   - ID: ${createEvent.event_id}`);
    console.log(`   - Timestamp: ${createEvent.timestamp}`);
    console.log(`   - Hash: ${createEvent.hash_after ? createEvent.hash_after.substring(0, 20) + '...' : 'null'}`);
  } else {
    console.log('❌ Événement de création non détecté');
  }

  console.log('\n📝 Test 2: Modification de fichier');
  await fs.appendFile(path.join(TEST_DIR, 'test1.txt'), '\nModified!');
  await sleep(3000);

  events = await readEvents();
  const modifyEvent = events.find(e => e.file_path.includes('test1.txt') && e.event_type === 'modified');
  if (modifyEvent) {
    console.log('✅ Événement de modification détecté');
    console.log(`   - ID: ${modifyEvent.event_id}`);
    console.log(`   - New size: ${modifyEvent.new_size} bytes`);
  } else {
    console.log('❌ Événement de modification non détecté');
  }

  console.log('\n📝 Test 3: Suppression de fichier');
  await fs.unlink(path.join(TEST_DIR, 'test1.txt'));
  await sleep(3000);

  events = await readEvents();
  const deleteEvent = events.find(e => e.file_path.includes('test1.txt') && e.event_type === 'deleted');
  if (deleteEvent) {
    console.log('✅ Événement de suppression détecté');
    console.log(`   - ID: ${deleteEvent.event_id}`);
  } else {
    console.log('❌ Événement de suppression non détecté');
  }

  console.log('\n📊 Résumé:');
  console.log(`   Total d'événements enregistrés: ${events.length}`);
  console.log(`   - created: ${events.filter(e => e.event_type === 'created').length}`);
  console.log(`   - modified: ${events.filter(e => e.event_type === 'modified').length}`);
  console.log(`   - deleted: ${events.filter(e => e.event_type === 'deleted').length}`);
}

async function main() {
  // Nettoyer les logs précédents
  try {
    await fs.unlink(LOG_FILE);
    console.log('🧹 Logs précédents nettoyés\n');
  } catch (error) {
    // Pas grave si le fichier n'existe pas
  }

  // Nettoyer le dossier de test
  try {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  } catch (error) {}

  await fs.mkdir(TEST_DIR, { recursive: true });
  console.log(`📁 Dossier de test créé: ${TEST_DIR}\n`);

  // Lancer le serveur MCP en arrière-plan
  console.log('🚀 Démarrage du serveur MCP...\n');

  const server = spawn('node', ['index.js'], {
    cwd: __dirname,
    stdio: 'pipe'
  });

  let serverOutput = '';

  server.stdout.on('data', (data) => {
    const output = data.toString();
    serverOutput += output;
    process.stdout.write(output);
  });

  server.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  // Attendre que le serveur soit prêt
  await sleep(5000);

  // Exécuter les tests
  await testFileOperations();

  // Arrêter le serveur
  console.log('\n🛑 Arrêt du serveur...');
  server.kill('SIGINT');

  await sleep(2000);

  console.log('\n✅ Tests terminés!');
  console.log(`📋 Vérifiez le fichier de log: ${LOG_FILE}`);
}

main().catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});
