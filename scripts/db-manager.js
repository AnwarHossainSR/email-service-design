const { execSync } = require('child_process');

const DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'email_service'
};

function runCommand(command, description) {
  console.log(`🔄 ${description}...`);
  try {
    execSync(command, { 
      stdio: 'inherit', 
      env: { ...process.env, PGPASSWORD: DB_CONFIG.password }
    });
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ ${description} failed`);
    process.exit(1);
  }
}

function dropDatabase() {
  // Terminate active connections first
  const terminateCmd = `psql -h ${DB_CONFIG.host} -U ${DB_CONFIG.username} -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_CONFIG.database}' AND pid <> pg_backend_pid();"`;
  try {
    execSync(terminateCmd, { env: { ...process.env, PGPASSWORD: DB_CONFIG.password } });
  } catch (error) {
    // Ignore errors if database doesn't exist
  }
  
  const cmd = `psql -h ${DB_CONFIG.host} -U ${DB_CONFIG.username} -c "DROP DATABASE IF EXISTS ${DB_CONFIG.database};"`;
  runCommand(cmd, 'Dropping database');
}

function createDatabase() {
  const cmd = `psql -h ${DB_CONFIG.host} -U ${DB_CONFIG.username} -c "CREATE DATABASE ${DB_CONFIG.database};"`;
  runCommand(cmd, 'Creating database');
}

function generateMigrations() {
  runCommand('npm run db:generate', 'Generating migrations');
}

function runMigrations() {
  runCommand('npm run db:migrate', 'Running migrations');
}

function resetDatabase() {
  dropDatabase();
  createDatabase();
  generateMigrations();
  runMigrations();
  console.log('✅ Database reset completed!');
}

const command = process.argv[2];

switch (command) {
  case 'drop':
    dropDatabase();
    break;
  case 'create':
    createDatabase();
    break;
  case 'migrate':
    generateMigrations();
    runMigrations();
    break;
  case 'reset':
    resetDatabase();
    break;
  default:
    console.log(`
📚 Available Commands:
npm run db:drop     - Drop database
npm run db:create   - Create database  
npm run db:migrate  - Generate and run migrations
npm run db:reset    - Drop, create, and migrate
    `);
}