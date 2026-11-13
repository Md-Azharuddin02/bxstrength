import { dbPool } from './db.ts';
import { runSetupStatements } from './dbSetup.ts';
import { ensureTrainerColumnsExist } from '../models/trainer.ts';

export const initDatabase = () => {
  if (dbPool) {
    dbPool.on('error', () => { });

    dbPool.query('SELECT NOW()', async (err, res) => {
      if (!err) {
        console.log(`  ➜  Database:   connected (${res.rows[0].now})`);
        try {
          await runSetupStatements(dbPool, `
            CREATE TABLE IF NOT EXISTS users (
              id VARCHAR(64) PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              email VARCHAR(255) UNIQUE NOT NULL,
              password_hash VARCHAR(255) NOT NULL,
              role VARCHAR(50) DEFAULT 'client',
              phone VARCHAR(100),
              avatar_url TEXT,
              is_verified BOOLEAN DEFAULT false,
              status VARCHAR(50) DEFAULT 'pending_verification',
              signup_method VARCHAR(50) DEFAULT 'Email / Password',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS otps (
              email VARCHAR(255) PRIMARY KEY,
              otp_code VARCHAR(64) NOT NULL,
              expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
              attempts INT DEFAULT 0,
              last_sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS support_tickets (
              id VARCHAR(64) PRIMARY KEY,
              user_id VARCHAR(64) NOT NULL,
              user_name VARCHAR(255) NOT NULL,
              user_email VARCHAR(255) NOT NULL,
              subject VARCHAR(500) NOT NULL,
              category VARCHAR(100) DEFAULT 'General',
              priority VARCHAR(50) DEFAULT 'medium',
              description TEXT NOT NULL,
              status VARCHAR(50) DEFAULT 'open',
              admin_response TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS assigned_agent VARCHAR(255);
            ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS assigned_agent_role VARCHAR(50);
            ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS escalation_history JSONB DEFAULT '[]'::jsonb;

            CREATE TABLE IF NOT EXISTS reviews (
              id VARCHAR(64) PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              role VARCHAR(255),
              rating INT DEFAULT 5,
              comment TEXT NOT NULL,
              avatar TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS enquiries (
              id VARCHAR(64) PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              email VARCHAR(255) NOT NULL,
              phone VARCHAR(100),
              preferred_contact_method VARCHAR(20),
              subject VARCHAR(500),
              message TEXT NOT NULL,
              status VARCHAR(50) DEFAULT 'new',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS payment_transactions (
              id VARCHAR(64) PRIMARY KEY,
              idempotency_key VARCHAR(128) UNIQUE,
              user_email VARCHAR(255) NOT NULL,
              user_name VARCHAR(255),
              plan_name VARCHAR(255) NOT NULL,
              service_type VARCHAR(50) DEFAULT 'individual',
              custom_exercises TEXT,
              amount NUMERIC(10, 2) NOT NULL,
              currency VARCHAR(10) DEFAULT 'GBP',
              gateway VARCHAR(50) NOT NULL,
              gateway_order_id VARCHAR(255),
              gateway_payment_id VARCHAR(255),
              status VARCHAR(50) NOT NULL DEFAULT 'initiated',
              failure_reason TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS processed_webhooks (
              event_id VARCHAR(255) PRIMARY KEY,
              gateway VARCHAR(50) NOT NULL,
              event_type VARCHAR(100) NOT NULL,
              processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS announcements (
              id VARCHAR(64) PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              message TEXT NOT NULL,
              target_role VARCHAR(50) DEFAULT 'all',
              priority VARCHAR(50) DEFAULT 'medium',
              author_name VARCHAR(255) DEFAULT 'System Admin',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS workout_programs (
              id VARCHAR(64) PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              description TEXT,
              level VARCHAR(50) DEFAULT 'Intermediate',
              duration_weeks INT DEFAULT 4,
              assigned_to_user_id VARCHAR(64),
              assigned_to_user_name VARCHAR(255),
              assigned_coach_name VARCHAR(255),
              exercises TEXT,
              created_by VARCHAR(255) DEFAULT 'Head Coach',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS nutrition_plans (
              id VARCHAR(64) PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              assigned_to_user_id VARCHAR(64),
              assigned_to_user_name VARCHAR(255),
              assigned_coach_name VARCHAR(255),
              daily_calories INT DEFAULT 2400,
              target_protein_g INT DEFAULT 190,
              target_carbs_g INT DEFAULT 220,
              target_fat_g INT DEFAULT 70,
              meals TEXT,
              created_by VARCHAR(255) DEFAULT 'Head Nutritionist',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS classes (
              id VARCHAR(64) PRIMARY KEY,
              title VARCHAR(255) NOT NULL,
              category VARCHAR(50) DEFAULT 'strength',
              trainer_id VARCHAR(64),
              trainer_name VARCHAR(255),
              day_of_week VARCHAR(50),
              start_time VARCHAR(50),
              end_time VARCHAR(50),
              room VARCHAR(100),
              max_capacity INT DEFAULT 20,
              booked_count INT DEFAULT 0,
              price NUMERIC(10, 2) DEFAULT 0.00,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS coach_assignments (
              id VARCHAR(64) PRIMARY KEY,
              assignment_type VARCHAR(64) NOT NULL,
              reference_id VARCHAR(64),
              title VARCHAR(255) NOT NULL,
              description TEXT,
              instructions TEXT,
              assigned_coach_id VARCHAR(64),
              assigned_coach_name VARCHAR(255) NOT NULL,
              client_id VARCHAR(64),
              client_name VARCHAR(255),
              client_email VARCHAR(255),
              service_id VARCHAR(64),
              service_name VARCHAR(255),
              assigned_by_id VARCHAR(64),
              assigned_by_name VARCHAR(255) DEFAULT 'Shaban Faridi',
              assigned_by_role VARCHAR(100) DEFAULT 'Head Coach',
              assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              due_date VARCHAR(100),
              schedule_time VARCHAR(100),
              priority VARCHAR(50) DEFAULT 'medium',
              status VARCHAR(64) DEFAULT 'assigned',
              is_published_to_client BOOLEAN DEFAULT FALSE,
              published_to_client_at TIMESTAMP WITH TIME ZONE,
              version INT DEFAULT 1,
              approval_logs TEXT,
              details TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS subscriptions (
              id VARCHAR(64) PRIMARY KEY,
              user_id VARCHAR(64) NOT NULL,
              user_name VARCHAR(255),
              user_email VARCHAR(255) NOT NULL,
              plan_name VARCHAR(255) NOT NULL,
              price NUMERIC(10, 2) NOT NULL,
              billing_cycle VARCHAR(50) DEFAULT 'monthly',
              status VARCHAR(50) DEFAULT 'active',
              start_date VARCHAR(100),
              end_date VARCHAR(100),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS audit_logs (
              id VARCHAR(64) PRIMARY KEY,
              user_id VARCHAR(64),
              user_name VARCHAR(255),
              user_role VARCHAR(50),
              action VARCHAR(255) NOT NULL,
              details TEXT,
              ip_address VARCHAR(100),
              timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS body_stats (
              id VARCHAR(64) PRIMARY KEY,
              user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
              date DATE NOT NULL,
              weight_kg NUMERIC(5,2) NOT NULL,
              height_cm NUMERIC(5,2) NOT NULL,
              bmi NUMERIC(4,1) NOT NULL,
              bmi_category VARCHAR(50) NOT NULL,
              body_fat_percentage NUMERIC(4,1),
              chest_cm NUMERIC(5,2),
              waist_cm NUMERIC(5,2),
              biceps_cm NUMERIC(5,2),
              thighs_cm NUMERIC(5,2),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_body_stats_user_date ON body_stats (user_id, date DESC);

            CREATE TABLE IF NOT EXISTS uk_booking_journeys (
              id VARCHAR(64) PRIMARY KEY,
              session_id VARCHAR(128),
              user_email VARCHAR(255) NOT NULL,
              user_name VARCHAR(255),
              user_phone VARCHAR(100),
              service_title VARCHAR(255) NOT NULL,
              service_category VARCHAR(255),
              service_type VARCHAR(50) DEFAULT 'individual',
              custom_exercises TEXT,
              amount_gbp NUMERIC(10, 2) NOT NULL,
              currency VARCHAR(10) DEFAULT 'GBP',
              payment_date VARCHAR(100),
              payment_status VARCHAR(50) DEFAULT 'Pending',
              journey_state VARCHAR(50) DEFAULT 'SERVICE_SELECTED',
              coach_name VARCHAR(255),
              coach_title VARCHAR(255),
              coach_avatar TEXT,
              scheduled_date VARCHAR(255),
              scheduled_time VARCHAR(255),
              time_zone VARCHAR(50),
              duration VARCHAR(50),
              join_url TEXT,
              transaction_id VARCHAR(128),
              gateway_order_id VARCHAR(128),
              gateway_payment_id VARCHAR(128),
              terms_consent_accepted BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            ALTER TABLE uk_booking_journeys ADD COLUMN IF NOT EXISTS gateway_order_id VARCHAR(128);
            ALTER TABLE uk_booking_journeys ADD COLUMN IF NOT EXISTS gateway_payment_id VARCHAR(128);
            ALTER TABLE uk_booking_journeys ADD COLUMN IF NOT EXISTS terms_consent_accepted BOOLEAN DEFAULT FALSE;

            CREATE TABLE IF NOT EXISTS trainers (
              id VARCHAR(64) PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              role VARCHAR(255) NOT NULL,
              coach_position VARCHAR(100) DEFAULT 'SENIOR COACH',
              headline TEXT,
              image TEXT NOT NULL,
              bio TEXT NOT NULL,
              secondary_bio TEXT,
              specialties TEXT,
              experience_years INT DEFAULT 5,
              clients_served INT DEFAULT 1000,
              rating NUMERIC(3,1) DEFAULT 5.0,
              languages TEXT,
              availability VARCHAR(255),
              certification TEXT,
              certifications TEXT,
              achievements TEXT,
              socials TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            ALTER TABLE users ADD COLUMN IF NOT EXISTS coach_position VARCHAR(100) DEFAULT 'Senior Coach';
            ALTER TABLE users ADD COLUMN IF NOT EXISTS height_cm INTEGER DEFAULT 175;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 25;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(50) DEFAULT 'Other';
            ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(100) DEFAULT 'Normal User';
            ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_statements TEXT DEFAULT '[]';
            ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_method VARCHAR(50) DEFAULT 'Email / Password';
            ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
            ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_coach VARCHAR(255);
            ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_head_coach VARCHAR(255);
            ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_methods TEXT;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(100);

            ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS target_user_id VARCHAR(64);
            ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS target_name VARCHAR(255);
            ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS prev_value TEXT;
            ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS new_value TEXT;
            ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_id VARCHAR(64);

            ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT '1-on-1 Coaching';
            ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'normal';
            ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS weightage VARCHAR(100) DEFAULT 'Normal Weightage (50/100)';
            ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS assigned_coach VARCHAR(255) DEFAULT 'Unassigned';
            ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS transferred_to_headcoach BOOLEAN DEFAULT FALSE;
            ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS preferred_contact_method VARCHAR(20);

            ALTER TABLE workout_programs ADD COLUMN IF NOT EXISTS assigned_by VARCHAR(255);
            ALTER TABLE workout_programs ADD COLUMN IF NOT EXISTS assigned_by_role VARCHAR(100);
            ALTER TABLE workout_programs ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
            ALTER TABLE workout_programs ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'assigned';
            ALTER TABLE workout_programs ADD COLUMN IF NOT EXISTS coach_approval_status VARCHAR(50) DEFAULT 'pending';
            ALTER TABLE workout_programs ADD COLUMN IF NOT EXISTS coach_approval_notes TEXT;
            ALTER TABLE workout_programs ADD COLUMN IF NOT EXISTS headcoach_approval_status VARCHAR(50) DEFAULT 'pending';
            ALTER TABLE workout_programs ADD COLUMN IF NOT EXISTS headcoach_approval_notes TEXT;
            ALTER TABLE workout_programs ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
            ALTER TABLE workout_programs ADD COLUMN IF NOT EXISTS approval_logs TEXT;
            ALTER TABLE workout_programs ADD COLUMN IF NOT EXISTS is_published_to_client BOOLEAN DEFAULT FALSE;
            ALTER TABLE workout_programs ADD COLUMN IF NOT EXISTS published_to_client_at TIMESTAMP WITH TIME ZONE;

            ALTER TABLE nutrition_plans ADD COLUMN IF NOT EXISTS assigned_by VARCHAR(255);
            ALTER TABLE nutrition_plans ADD COLUMN IF NOT EXISTS assigned_by_role VARCHAR(100);
            ALTER TABLE nutrition_plans ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
            ALTER TABLE nutrition_plans ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'assigned';
            ALTER TABLE nutrition_plans ADD COLUMN IF NOT EXISTS coach_approval_status VARCHAR(50) DEFAULT 'pending';
            ALTER TABLE nutrition_plans ADD COLUMN IF NOT EXISTS coach_approval_notes TEXT;
            ALTER TABLE nutrition_plans ADD COLUMN IF NOT EXISTS headcoach_approval_status VARCHAR(50) DEFAULT 'pending';
            ALTER TABLE nutrition_plans ADD COLUMN IF NOT EXISTS headcoach_approval_notes TEXT;
            ALTER TABLE nutrition_plans ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
            ALTER TABLE nutrition_plans ADD COLUMN IF NOT EXISTS approval_logs TEXT;
            ALTER TABLE nutrition_plans ADD COLUMN IF NOT EXISTS is_published_to_client BOOLEAN DEFAULT FALSE;
            ALTER TABLE nutrition_plans ADD COLUMN IF NOT EXISTS published_to_client_at TIMESTAMP WITH TIME ZONE;

            ALTER TABLE classes ADD COLUMN IF NOT EXISTS assigned_by VARCHAR(255);
            ALTER TABLE classes ADD COLUMN IF NOT EXISTS assigned_by_role VARCHAR(100);
            ALTER TABLE classes ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
            ALTER TABLE classes ADD COLUMN IF NOT EXISTS is_published_to_client BOOLEAN DEFAULT TRUE;
            ALTER TABLE classes ADD COLUMN IF NOT EXISTS published_to_client_at TIMESTAMP WITH TIME ZONE;

            ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS assigned_by VARCHAR(255);
            ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS assigned_by_role VARCHAR(100);
            ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
            ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS is_published_to_client BOOLEAN DEFAULT TRUE;
            ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS published_to_client_at TIMESTAMP WITH TIME ZONE;

            CREATE TABLE IF NOT EXISTS in_app_notifications (
              id VARCHAR(255) PRIMARY KEY,
              user_id VARCHAR(255),
              user_email VARCHAR(255) NOT NULL,
              title VARCHAR(255) NOT NULL,
              message TEXT NOT NULL,
              content_type VARCHAR(100) DEFAULT 'general',
              coach_name VARCHAR(255),
              link_tab VARCHAR(100),
              is_read BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS email_notifications_log (
              id VARCHAR(255) PRIMARY KEY,
              to_email VARCHAR(255) NOT NULL,
              to_name VARCHAR(255),
              subject VARCHAR(255) NOT NULL,
              content_type VARCHAR(100),
              coach_name VARCHAR(255),
              publication_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              view_link TEXT,
              status VARCHAR(50) DEFAULT 'Sent',
              sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
          `);

          await ensureTrainerColumnsExist();
          await runSetupStatements(dbPool, `
            CREATE TABLE IF NOT EXISTS assessments (
              id VARCHAR(100) PRIMARY KEY,
              client_name VARCHAR(255) NOT NULL,
              client_email VARCHAR(255) NOT NULL,
              client_phone VARCHAR(50),
              preferred_contact_method VARCHAR(50),
              primary_goal VARCHAR(255),
              main_obstacle VARCHAR(255),
              experience_level VARCHAR(100),
              weekly_commitment VARCHAR(100),
              training_location VARCHAR(100),
              equipment TEXT,
              training_interest TEXT,
              has_injury TEXT,
              status VARCHAR(50) DEFAULT 'Pending',
              assigned_coach_id VARCHAR(100),
              assigned_coach_name VARCHAR(255),
              assigned_by VARCHAR(255),
              assigned_at TIMESTAMP WITH TIME ZONE,
              coach_notes TEXT,
              coach_feedback TEXT,
              recommended_plan TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_assessments_client_email ON assessments (LOWER(client_email));

            CREATE TABLE IF NOT EXISTS paid_bookings (
              id VARCHAR(100) PRIMARY KEY,
              order_id VARCHAR(100),
              payment_id VARCHAR(100),
              user_id VARCHAR(100),
              client_name VARCHAR(255) NOT NULL,
              client_email VARCHAR(255) NOT NULL,
              client_phone VARCHAR(50),
              package_name VARCHAR(255) NOT NULL,
              package_type VARCHAR(50) DEFAULT 'standard',
              total_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
              currency VARCHAR(10) DEFAULT 'GBP',
              total_sessions INTEGER NOT NULL DEFAULT 1,
              completed_sessions INTEGER NOT NULL DEFAULT 0,
              duration_minutes INTEGER DEFAULT 45,
              validity_days INTEGER DEFAULT 30,
              customized_details JSONB,
              session_focus_list JSONB,
              status VARCHAR(50) DEFAULT 'Active',
              assigned_coach_id VARCHAR(100),
              assigned_coach_name VARCHAR(255),
              assigned_by VARCHAR(255),
              assigned_at TIMESTAMP WITH TIME ZONE,
              meeting_link TEXT,
              coach_notes TEXT,
              scheduled_at TIMESTAMP WITH TIME ZONE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            ALTER TABLE paid_bookings ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE;
          `);
        } catch (setupErr: any) {
          console.error('[DB SETUP] failed:', setupErr?.message);
        }
      }
    });
  } else {
    console.log('ℹ[DATABASE_URL] Running in BxStrength local sync fallback mode.');
  }
};
