#!/bin/bash
# Clever Cloud post-deploy script
# This runs automatically after each deployment if configured in the Clever Cloud dashboard.
# If not automatic, run these commands manually in the Clever Cloud console.

echo "🚀 Initializing database (creates tables if missing)..."
npm run db:init

echo "🔧 Migrating existing databases for self-registration support..."
npm run db:migrate-registration

echo "🌱 Seeding demo data..."
npm run db:seed

echo "✅ Database is ready!"
