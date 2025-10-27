CREATE TABLE "campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"priority" varchar(20) DEFAULT 'normal' NOT NULL,
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"total_recipients" integer DEFAULT 0,
	"sent_count" integer DEFAULT 0,
	"failed_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "email_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer,
	"customer_id" integer,
	"recipient_email" varchar(255) NOT NULL,
	"status" varchar(50) NOT NULL,
	"error" text,
	"metadata" jsonb,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "email_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"customer_id" integer,
	"recipient_email" varchar(255) NOT NULL,
	"recipient_name" varchar(255),
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"priority" integer DEFAULT 500 NOT NULL,
	"retry_count" integer DEFAULT 0,
	"max_retries" integer DEFAULT 3,
	"error" text,
	"scheduled_at" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "system_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"level" varchar(20) NOT NULL,
	"category" varchar(50) NOT NULL,
	"message" text NOT NULL,
	"user_id" integer,
	"campaign_id" integer,
	"metadata" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "email_queue" ADD CONSTRAINT "email_queue_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "email_queue" ADD CONSTRAINT "email_queue_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;
CREATE INDEX "campaigns_user_id_idx" ON "campaigns" USING btree ("user_id");
CREATE INDEX "campaigns_status_idx" ON "campaigns" USING btree ("status");
CREATE INDEX "campaigns_priority_idx" ON "campaigns" USING btree ("priority");
CREATE INDEX "customers_user_id_idx" ON "customers" USING btree ("user_id");
CREATE INDEX "email_logs_campaign_id_idx" ON "email_logs" USING btree ("campaign_id");
CREATE INDEX "email_logs_status_idx" ON "email_logs" USING btree ("status");
CREATE INDEX "email_queue_campaign_id_idx" ON "email_queue" USING btree ("campaign_id");
CREATE INDEX "email_queue_status_idx" ON "email_queue" USING btree ("status");
CREATE INDEX "email_queue_customer_id_idx" ON "email_queue" USING btree ("customer_id");
CREATE INDEX "system_logs_level_idx" ON "system_logs" USING btree ("level");
CREATE INDEX "system_logs_category_idx" ON "system_logs" USING btree ("category");
CREATE INDEX "system_logs_created_at_idx" ON "system_logs" USING btree ("created_at");
CREATE INDEX "system_logs_user_id_idx" ON "system_logs" USING btree ("user_id");
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");