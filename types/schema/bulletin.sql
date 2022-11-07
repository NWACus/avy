-- Table: national.bulletin

-- DROP TABLE "national".bulletin;

CREATE TABLE IF NOT EXISTS "national".bulletin
(
    id integer NOT NULL DEFAULT nextval('"national".bulletin_id_seq'::regclass),
    center_id character varying(6) COLLATE pg_catalog."default",
    zone_id character varying(50) COLLATE pg_catalog."default",
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    posted timestamp without time zone,
    danger_rating smallint NOT NULL DEFAULT 0,
    comment text COLLATE pg_catalog."default",
    url character varying(160) COLLATE pg_catalog."default",
    start_date_tz timestamp with time zone,
    end_date_tz timestamp with time zone,
    author character varying(100) COLLATE pg_catalog."default",
    product_type character varying(50) COLLATE pg_catalog."default",
    avalanche_danger jsonb,
    avalanche_danger_outlook jsonb,
    bottom_line text COLLATE pg_catalog."default",
    hazard_discussion text COLLATE pg_catalog."default",
    weather_discussion text COLLATE pg_catalog."default",
    announcement text COLLATE pg_catalog."default",
    status character varying(20) COLLATE pg_catalog."default",
    media jsonb,
    weather_data jsonb,
    forecast_zone_id text[] COLLATE pg_catalog."default",
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone,
    json_data json,
    no_forecast_array boolean,
    forecast_zone_id_legacy integer[],
    CONSTRAINT "PK_bulletin_id" PRIMARY KEY (id)
)
