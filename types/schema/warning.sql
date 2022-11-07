-- Table: national.warning

-- DROP TABLE "national".warning;

CREATE TABLE IF NOT EXISTS "national".warning
(
    id integer NOT NULL DEFAULT nextval('"national".warning_id_seq'::regclass),
    center_id character varying(6) COLLATE pg_catalog."default" NOT NULL,
    zone_id character varying(12) COLLATE pg_catalog."default",
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    reason text COLLATE pg_catalog."default",
    tweet character varying(140) COLLATE pg_catalog."default",
    date_modified timestamp with time zone,
    date_issued timestamp with time zone,
    product character varying(15) COLLATE pg_catalog."default" NOT NULL,
    cancel boolean,
    url character varying(120) COLLATE pg_catalog."default",
    forecast_zones character varying(50)[] COLLATE pg_catalog."default",
    sstype character varying(12) COLLATE pg_catalog."default",
    affected_area text COLLATE pg_catalog."default",
    instructions text COLLATE pg_catalog."default",
    danger text COLLATE pg_catalog."default",
    approved boolean DEFAULT false,
    original_warning_id integer,
    state_nws_zones character varying(40)[] COLLATE pg_catalog."default",
    state2_nws_zones character varying(30)[] COLLATE pg_catalog."default",
    updated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT warning_pkey PRIMARY KEY (id)
)
