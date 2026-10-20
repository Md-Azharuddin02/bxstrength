

\restrict J3BpQ6Yec5DnsmCnx6TeiGRvWaTphx0gAmWSAdqYh46tk3ukbcbnzTP0DFu6Gcm


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.announcements (
    id character varying(64) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    target_role character varying(50) DEFAULT 'all'::character varying,
    priority character varying(50) DEFAULT 'medium'::character varying,
    author_name character varying(255) NOT NULL
);




CREATE TABLE IF NOT EXISTS public.attendance_records (
    id character varying(64) NOT NULL,
    user_id character varying(64),
    user_name character varying(255) NOT NULL,
    class_name character varying(255) NOT NULL,
    date date NOT NULL,
    status character varying(50) DEFAULT 'Attended'::character varying NOT NULL,
    marked_by character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);




CREATE TABLE IF NOT EXISTS public.audit_logs (
    id character varying(64) NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    user_id character varying(64),
    user_name character varying(255),
    user_role character varying(50),
    action character varying(255) NOT NULL,
    details text,
    ip_address character varying(50),
    target_user_id character varying(64),
    target_name character varying(255),
    prev_value text,
    new_value text,
    entity_id character varying(64)
);



CREATE TABLE IF NOT EXISTS public.body_stats (
    id character varying(64) NOT NULL,
    user_id character varying(64),
    date date NOT NULL,
    weight_kg numeric(5,2) NOT NULL,
    height_cm numeric(5,2) NOT NULL,
    bmi numeric(4,1) NOT NULL,
    bmi_category character varying(50) NOT NULL,
    body_fat_percentage numeric(4,1),
    chest_cm numeric(5,2),
    waist_cm numeric(5,2),
    biceps_cm numeric(5,2),
    thighs_cm numeric(5,2),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);




CREATE TABLE IF NOT EXISTS public.bookings (
    id character varying(64) NOT NULL,
    user_id character varying(64),
    user_name character varying(255) NOT NULL,
    user_email character varying(255) NOT NULL,
    class_id character varying(64),
    class_name character varying(255) NOT NULL,
    trainer_name character varying(255) NOT NULL,
    date date NOT NULL,
    time_slot character varying(50) NOT NULL,
    status character varying(50) DEFAULT 'Confirmed'::character varying NOT NULL,
    booking_code character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);




CREATE TABLE IF NOT EXISTS public.class_schedules (
    id character varying(64) NOT NULL,
    title character varying(255) NOT NULL,
    category character varying(50) NOT NULL,
    trainer_id character varying(64),
    trainer_name character varying(255) NOT NULL,
    day_of_week character varying(20) NOT NULL,
    start_time character varying(20) NOT NULL,
    end_time character varying(20) NOT NULL,
    room character varying(100) NOT NULL,
    max_capacity integer DEFAULT 20 NOT NULL,
    booked_count integer DEFAULT 0 NOT NULL,
    price numeric(8,2) DEFAULT 0.00 NOT NULL
);




CREATE TABLE IF NOT EXISTS public.classes (
    id character varying(64) NOT NULL,
    title character varying(255) NOT NULL,
    category character varying(50) DEFAULT 'strength'::character varying,
    trainer_id character varying(64),
    trainer_name character varying(255),
    day_of_week character varying(50),
    start_time character varying(50),
    end_time character varying(50),
    room character varying(100),
    max_capacity integer DEFAULT 20,
    booked_count integer DEFAULT 0,
    price numeric(10,2) DEFAULT 0.00,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    assigned_by character varying(255),
    assigned_by_role character varying(100),
    assigned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_published_to_client boolean DEFAULT true,
    published_to_client_at timestamp with time zone
);




CREATE TABLE IF NOT EXISTS public.coach_assignments (
    id character varying(64) NOT NULL,
    assignment_type character varying(64) NOT NULL,
    reference_id character varying(64),
    title character varying(255) NOT NULL,
    description text,
    instructions text,
    assigned_coach_id character varying(64),
    assigned_coach_name character varying(255) NOT NULL,
    client_id character varying(64),
    client_name character varying(255),
    client_email character varying(255),
    service_id character varying(64),
    service_name character varying(255),
    assigned_by_id character varying(64),
    assigned_by_name character varying(255) DEFAULT 'Shaban Faridi'::character varying,
    assigned_by_role character varying(100) DEFAULT 'Head Coach'::character varying,
    assigned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    due_date character varying(100),
    schedule_time character varying(100),
    priority character varying(50) DEFAULT 'medium'::character varying,
    status character varying(64) DEFAULT 'assigned'::character varying,
    is_published_to_client boolean DEFAULT false,
    published_to_client_at timestamp with time zone,
    version integer DEFAULT 1,
    approval_logs text,
    details text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE IF NOT EXISTS public.consultations (
    id character varying(100) NOT NULL,
    client_name character varying(255) NOT NULL,
    client_email character varying(255) NOT NULL,
    client_phone character varying(50),
    goal character varying(255),
    duration character varying(50),
    preferred_date character varying(50),
    preferred_time character varying(100),
    status character varying(50) DEFAULT 'Confirmed'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);




CREATE TABLE IF NOT EXISTS public.email_notifications_log (
    id character varying(255) NOT NULL,
    to_email character varying(255) NOT NULL,
    to_name character varying(255),
    subject character varying(255) NOT NULL,
    content_type character varying(100),
    coach_name character varying(255),
    publication_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    view_link text,
    status character varying(50) DEFAULT 'Sent'::character varying,
    sent_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);




CREATE TABLE IF NOT EXISTS public.enquiries (
    id character varying(64) NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(50),
    subject character varying(255) NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(50) DEFAULT 'new'::character varying NOT NULL,
    assigned_notes text,
    category character varying(100) DEFAULT '1-on-1 Coaching'::character varying,
    priority character varying(50) DEFAULT 'normal'::character varying,
    weightage character varying(100) DEFAULT 'Normal Weightage (50/100)'::character varying,
    assigned_coach character varying(255) DEFAULT 'Unassigned'::character varying,
    transferred_to_headcoach boolean DEFAULT false,
    assigned_by character varying(255),
    assigned_by_role character varying(100),
    assigned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_published_to_client boolean DEFAULT true,
    published_to_client_at timestamp with time zone
);




CREATE TABLE IF NOT EXISTS public.in_app_notifications (
    id character varying(255) NOT NULL,
    user_id character varying(255),
    user_email character varying(255) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    content_type character varying(100) DEFAULT 'general'::character varying,
    coach_name character varying(255),
    link_tab character varying(100),
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);




CREATE TABLE IF NOT EXISTS public.nutrition_plans (
    id character varying(64) NOT NULL,
    title character varying(255) NOT NULL,
    assigned_to_user_id character varying(64),
    assigned_to_user_name character varying(255),
    daily_calories integer DEFAULT 2000 NOT NULL,
    target_protein_g integer DEFAULT 150 NOT NULL,
    target_carbs_g integer DEFAULT 200 NOT NULL,
    target_fat_g integer DEFAULT 65 NOT NULL,
    meals jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_by character varying(255) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    assigned_by character varying(255),
    assigned_by_role character varying(100),
    assigned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(50) DEFAULT 'assigned'::character varying,
    coach_approval_status character varying(50) DEFAULT 'pending'::character varying,
    coach_approval_notes text,
    headcoach_approval_status character varying(50) DEFAULT 'pending'::character varying,
    headcoach_approval_notes text,
    version integer DEFAULT 1,
    approval_logs text,
    is_published_to_client boolean DEFAULT false,
    published_to_client_at timestamp with time zone,
    assigned_coach_name character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);




CREATE TABLE IF NOT EXISTS public.otps (
    email character varying(255) NOT NULL,
    otp_code character varying(64) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    attempts integer DEFAULT 0,
    last_sent_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);




CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id character varying(64) NOT NULL,
    idempotency_key character varying(128),
    user_email character varying(255) NOT NULL,
    user_name character varying(255),
    plan_name character varying(255) NOT NULL,
    service_type character varying(50) DEFAULT 'individual'::character varying,
    custom_exercises text,
    amount numeric(10,2) NOT NULL,
    currency character varying(10) DEFAULT 'GBP'::character varying,
    gateway character varying(50) NOT NULL,
    gateway_order_id character varying(255),
    gateway_payment_id character varying(255),
    status character varying(50) DEFAULT 'initiated'::character varying NOT NULL,
    failure_reason text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);




CREATE TABLE IF NOT EXISTS public.processed_webhooks (
    event_id character varying(255) NOT NULL,
    gateway character varying(50) NOT NULL,
    event_type character varying(100) NOT NULL,
    processed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE IF NOT EXISTS public.reviews (
    id character varying(64) NOT NULL,
    name character varying(255) NOT NULL,
    role character varying(255),
    rating integer DEFAULT 5,
    comment text NOT NULL,
    avatar text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE IF NOT EXISTS public.subscriptions (
    id character varying(64) NOT NULL,
    user_id character varying(64),
    user_name character varying(255) NOT NULL,
    user_email character varying(255) NOT NULL,
    plan_name character varying(100) NOT NULL,
    billing_cycle character varying(50) DEFAULT 'monthly'::character varying NOT NULL,
    price numeric(8,2) NOT NULL,
    start_date date,
    next_billing_date date,
    status character varying(50) DEFAULT 'active'::character varying NOT NULL,
    auto_renew boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    end_date character varying(100)
);




CREATE TABLE IF NOT EXISTS public.support_tickets (
    id character varying(64) NOT NULL,
    user_id character varying(64) NOT NULL,
    user_name character varying(255) NOT NULL,
    user_email character varying(255) NOT NULL,
    subject character varying(500) NOT NULL,
    category character varying(100) DEFAULT 'General'::character varying,
    priority character varying(50) DEFAULT 'medium'::character varying,
    description text NOT NULL,
    status character varying(50) DEFAULT 'open'::character varying,
    admin_response text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE IF NOT EXISTS public.trainers (
    id character varying(64) NOT NULL,
    name character varying(255) NOT NULL,
    role character varying(255) NOT NULL,
    coach_position character varying(100) DEFAULT 'SENIOR COACH'::character varying,
    headline text,
    image text NOT NULL,
    bio text NOT NULL,
    secondary_bio text,
    specialties text,
    experience_years integer DEFAULT 5,
    clients_served integer DEFAULT 1000,
    rating numeric(3,1) DEFAULT 5.0,
    languages text,
    availability character varying(255),
    certification text,
    certifications text,
    achievements text,
    socials text,
    gallery_photos text,
    gallery_videos text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE IF NOT EXISTS public.uk_booking_journeys (
    id character varying(64) NOT NULL,
    session_id character varying(128),
    user_email character varying(255) NOT NULL,
    user_name character varying(255),
    user_phone character varying(100),
    service_title character varying(255) NOT NULL,
    service_category character varying(255),
    service_type character varying(50) DEFAULT 'individual'::character varying,
    custom_exercises text,
    amount_gbp numeric(10,2) NOT NULL,
    currency character varying(10) DEFAULT 'GBP'::character varying,
    payment_date character varying(100),
    payment_status character varying(50) DEFAULT 'Pending'::character varying,
    journey_state character varying(50) DEFAULT 'SERVICE_SELECTED'::character varying,
    coach_name character varying(255),
    coach_title character varying(255),
    coach_avatar text,
    scheduled_date character varying(255),
    scheduled_time character varying(255),
    time_zone character varying(50),
    duration character varying(50),
    join_url text,
    transaction_id character varying(128),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE IF NOT EXISTS public.users (
    id character varying(64) NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'client'::character varying NOT NULL,
    avatar_url text,
    phone character varying(50),
    age integer,
    gender character varying(50),
    emergency_contact character varying(255),
    fitness_goals text,
    is_verified boolean DEFAULT false,
    status character varying(50) DEFAULT 'pending_verification'::character varying,
    signup_method character varying(50) DEFAULT 'Email / Password'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_login_at timestamp with time zone,
    coach_position character varying(100) DEFAULT 'Senior Coach'::character varying,
    height_cm integer DEFAULT 175,
    subscription_tier character varying(100) DEFAULT 'Normal User'::character varying,
    billing_statements text DEFAULT '[]'::text,
    assigned_coach character varying(255),
    assigned_head_coach character varying(255)
);


CREATE TABLE IF NOT EXISTS public.workout_programs (
    id character varying(64) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    level character varying(50) DEFAULT 'Beginner'::character varying NOT NULL,
    duration_weeks integer DEFAULT 4 NOT NULL,
    assigned_to_user_id character varying(64),
    assigned_to_user_name character varying(255),
    created_by character varying(255) NOT NULL,
    exercises jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    assigned_by character varying(255),
    assigned_by_role character varying(100),
    assigned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(50) DEFAULT 'assigned'::character varying,
    coach_approval_status character varying(50) DEFAULT 'pending'::character varying,
    coach_approval_notes text,
    headcoach_approval_status character varying(50) DEFAULT 'pending'::character varying,
    headcoach_approval_notes text,
    version integer DEFAULT 1,
    approval_logs text,
    is_published_to_client boolean DEFAULT false,
    published_to_client_at timestamp with time zone,
    assigned_coach_name character varying(255),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);



ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);




ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);




ALTER TABLE ONLY public.body_stats
    ADD CONSTRAINT body_stats_pkey PRIMARY KEY (id);




ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);




ALTER TABLE ONLY public.class_schedules
    ADD CONSTRAINT class_schedules_pkey PRIMARY KEY (id);




ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);




ALTER TABLE ONLY public.coach_assignments
    ADD CONSTRAINT coach_assignments_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT consultations_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.email_notifications_log
    ADD CONSTRAINT email_notifications_log_pkey PRIMARY KEY (id);




ALTER TABLE ONLY public.enquiries
    ADD CONSTRAINT enquiries_pkey PRIMARY KEY (id);




ALTER TABLE ONLY public.in_app_notifications
    ADD CONSTRAINT in_app_notifications_pkey PRIMARY KEY (id);




ALTER TABLE ONLY public.nutrition_plans
    ADD CONSTRAINT nutrition_plans_pkey PRIMARY KEY (id);




ALTER TABLE ONLY public.otps
    ADD CONSTRAINT otps_pkey PRIMARY KEY (email);




ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_idempotency_key_key UNIQUE (idempotency_key);




ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_pkey PRIMARY KEY (id);




ALTER TABLE ONLY public.processed_webhooks
    ADD CONSTRAINT processed_webhooks_pkey PRIMARY KEY (event_id);




ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);




ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);




ALTER TABLE ONLY public.trainers
    ADD CONSTRAINT trainers_pkey PRIMARY KEY (id);




ALTER TABLE ONLY public.uk_booking_journeys
    ADD CONSTRAINT uk_booking_journeys_pkey PRIMARY KEY (id);




ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);



ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.workout_programs
    ADD CONSTRAINT workout_programs_pkey PRIMARY KEY (id);




CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs USING btree ("timestamp" DESC);




CREATE INDEX idx_body_stats_user_date ON public.body_stats USING btree (user_id, date DESC);



CREATE INDEX idx_bookings_class_date ON public.bookings USING btree (class_id, date);




CREATE INDEX idx_bookings_user_id ON public.bookings USING btree (user_id);



CREATE INDEX idx_class_schedules_day ON public.class_schedules USING btree (day_of_week);




CREATE INDEX idx_enquiries_status ON public.enquiries USING btree (status);



CREATE INDEX idx_nutrition_plans_assigned ON public.nutrition_plans USING btree (assigned_to_user_id);



CREATE INDEX idx_subscriptions_user_status ON public.subscriptions USING btree (user_id, status);




CREATE INDEX idx_users_email ON public.users USING btree (email);




CREATE INDEX idx_users_role ON public.users USING btree (role);




CREATE INDEX idx_users_status ON public.users USING btree (status);




CREATE INDEX idx_workout_programs_assigned ON public.workout_programs USING btree (assigned_to_user_id);




ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;




ALTER TABLE ONLY public.body_stats
    ADD CONSTRAINT body_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;



ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.class_schedules(id) ON DELETE CASCADE;




ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;




ALTER TABLE ONLY public.nutrition_plans
    ADD CONSTRAINT nutrition_plans_assigned_to_user_id_fkey FOREIGN KEY (assigned_to_user_id) REFERENCES public.users(id) ON DELETE SET NULL;




ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;




ALTER TABLE ONLY public.workout_programs
    ADD CONSTRAINT workout_programs_assigned_to_user_id_fkey FOREIGN KEY (assigned_to_user_id) REFERENCES public.users(id) ON DELETE SET NULL;



\unrestrict J3BpQ6Yec5DnsmCnx6TeiGRvWaTphx0gAmWSAdqYh46tk3ukbcbnzTP0DFu6Gcm

