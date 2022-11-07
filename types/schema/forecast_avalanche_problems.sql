-- Table: national.forecast_avalanche_problems

-- DROP TABLE "national".forecast_avalanche_problems;

CREATE TABLE IF NOT EXISTS "national".forecast_avalanche_problems
(
    id integer NOT NULL DEFAULT nextval('"national".forecast_avalanche_problems_id_seq'::regclass),
    forecast_id integer NOT NULL,
    avalanche_problem_id integer NOT NULL,
    rank integer NOT NULL,
    location text[] COLLATE pg_catalog."default",
    likelihood character varying(15) COLLATE pg_catalog."default",
    size text[] COLLATE pg_catalog."default",
    discussion text COLLATE pg_catalog."default",
    media jsonb,
    CONSTRAINT forecast_avalanche_problems_pkey PRIMARY KEY (id)
)
