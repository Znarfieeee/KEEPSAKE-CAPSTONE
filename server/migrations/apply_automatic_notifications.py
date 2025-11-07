#!/usr/bin/env python3
"""
Apply Automatic Notifications Migration
Applies the create_automatic_notifications_system.sql migration to Supabase
"""

import os
from pathlib import Path
from config.settings import supabase_service_role_client

def apply_migration():
    """Apply the automatic notifications migration"""
    try:
        # Read the migration file
        migration_file = Path(__file__).parent / "create_automatic_notifications_system.sql"

        with open(migration_file, 'r', encoding='utf-8') as f:
            sql_content = f.read()

        print("📦 Applying automatic notifications migration...")
        print("=" * 60)

        # Get Supabase client
        supabase = supabase_service_role_client()

        # Execute the migration
        # Note: Supabase Python client doesn't directly support raw SQL execution
        # You'll need to use the Supabase SQL Editor or pg client
        print("⚠️  This migration needs to be applied through Supabase SQL Editor")
        print("\nSteps:")
        print("1. Go to your Supabase Dashboard")
        print("2. Navigate to SQL Editor")
        print("3. Copy the contents of:")
        print(f"   {migration_file}")
        print("4. Paste into SQL Editor and run")
        print("\nOR use psql:")
        print(f"   psql $DATABASE_URL -f {migration_file}")

        print("\n" + "=" * 60)
        print("✅ Migration file ready at:", migration_file)

        # Verify tables exist
        print("\n🔍 Verifying required tables...")

        # Check appointments table
        try:
            result = supabase.table('appointments').select('appointment_id').limit(1).execute()
            print("✅ appointments table exists")
        except Exception as e:
            print(f"❌ appointments table check failed: {e}")

        # Check patients table
        try:
            result = supabase.table('patients').select('patient_id').limit(1).execute()
            print("✅ patients table exists")
        except Exception as e:
            print(f"❌ patients table check failed: {e}")

        # Check notifications table
        try:
            result = supabase.table('notifications').select('notification_id').limit(1).execute()
            print("✅ notifications table exists")
        except Exception as e:
            print(f"❌ notifications table check failed: {e}")

        # Check notification_preferences table
        try:
            result = supabase.table('notification_preferences').select('user_id').limit(1).execute()
            print("✅ notification_preferences table exists")
        except Exception as e:
            print(f"❌ notification_preferences table check failed: {e}")

        print("\n" + "=" * 60)
        print("📋 Next Steps:")
        print("1. Apply the migration SQL through Supabase Dashboard")
        print("2. Create qr_access_logs table if it doesn't exist")
        print("3. Create vaccinations table if it doesn't exist")
        print("4. Set up scheduled jobs (pg_cron or external scheduler)")
        print("5. Test the automatic notifications by creating appointments/QR accesses")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    apply_migration()
