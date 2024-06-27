--
-- NOTE:
--
-- File paths need to be edited. Search for $$PATH$$ and
-- replace it with the path to the directory containing
-- the extracted data files.
--
--
-- linhleQL database dump
--

-- Dumped from database version 11.3
-- Dumped by pg_dump version 11.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE pernflashcard;
--
-- Name: dvdrental; Type: DATABASE; Schema: -; Owner: linhle
--

CREATE DATABASE pernflashcard WITH TEMPLATE = template0 ENCODING = 'UTF8' LC_COLLATE = 'English_United States.1252' LC_CTYPE = 'English_United States.1252';


ALTER DATABASE pernflashcard OWNER TO linhle;

\connect pernflashcard

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: mpaa_rating; Type: TYPE; Schema: public; Owner: linhle
--

CREATE TYPE public.mpaa_rating AS ENUM (
    'G',
    'PG',
    'PG-13',
    'R',
    'NC-17'
);


ALTER TYPE public.mpaa_rating OWNER TO linhle;

--
-- Name: year; Type: DOMAIN; Schema: public; Owner: linhle
--

CREATE DOMAIN public.year AS integer
	CONSTRAINT year_check CHECK (((VALUE >= 1901) AND (VALUE <= 2155)));


ALTER DOMAIN public.year OWNER TO linhle;

--
-- Name: _group_concat(text, text); Type: FUNCTION; Schema: public; Owner: linhle
--

CREATE FUNCTION public._group_concat(text, text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $_$
SELECT CASE
  WHEN $2 IS NULL THEN $1
  WHEN $1 IS NULL THEN $2
  ELSE $1 || ', ' || $2
END
$_$;


ALTER FUNCTION public._group_concat(text, text) OWNER TO linhle;

--
-- Name: last_day(timestamp without time zone); Type: FUNCTION; Schema: public; Owner: linhle
--

CREATE FUNCTION public.last_day(timestamp without time zone) RETURNS date
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
  SELECT CASE
    WHEN EXTRACT(MONTH FROM $1) = 12 THEN
      (((EXTRACT(YEAR FROM $1) + 1) operator(pg_catalog.||) '-01-01')::date - INTERVAL '1 day')::date
    ELSE
      ((EXTRACT(YEAR FROM $1) operator(pg_catalog.||) '-' operator(pg_catalog.||) (EXTRACT(MONTH FROM $1) + 1) operator(pg_catalog.||) '-01')::date - INTERVAL '1 day')::date
    END
$_$;


ALTER FUNCTION public.last_day(timestamp without time zone) OWNER TO linhle;

--
-- Name: last_updated(); Type: FUNCTION; Schema: public; Owner: linhle
--

CREATE FUNCTION public.last_updated() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.last_update = CURRENT_TIMESTAMP;
    RETURN NEW;
END $$;


ALTER FUNCTION public.last_updated() OWNER TO linhle;

--
-- Name: creator_creator_id_seq; Type: SEQUENCE; Schema: public; Owner: linhle
--

CREATE SEQUENCE public.creator_creator_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.creator_creator_id_seq OWNER TO linhle;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: creator; Type: TABLE; Schema: public; Owner: linhle
--

CREATE TABLE public.creator (
    creator_id integer DEFAULT nextval('public.creator_creator_id_seq'::regclass) NOT NULL,
    first_name character varying(45) NOT NULL,
    last_name character varying(45) NOT NULL,
    email character varying(50) NOT NULL,
    country_id smallint NOT NULL,
    language_id smallint NOT NULL,
    media_id smallint,
    flashcard_id smallint[],
    password character varying(255) NOT NULL,
    image character varying(255) NOT NULL,
    about_me text,
    phone character varying(15),
    create_date date DEFAULT ('now'::text)::date NOT NULL,
    last_update timestamp without time zone DEFAULT now(),
    active integer
);


ALTER TABLE public.creator OWNER TO linhle;

--
-- Name: group_concat(text); Type: AGGREGATE; Schema: public; Owner: linhle
--

CREATE AGGREGATE public.group_concat(text) (
    SFUNC = public._group_concat,
    STYPE = text
);


ALTER AGGREGATE public.group_concat(text) OWNER TO linhle;

--
-- Name: media_media_id_seq; Type: SEQUENCE; Schema: public; Owner: linhle
--

CREATE SEQUENCE public.media_media_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.media_media_id_seq OWNER TO linhle;

--
-- Name: media; Type: TABLE; Schema: public; Owner: linhle
--

CREATE TABLE public.media (
    media_id integer DEFAULT nextval('public.media_media_id_seq'::regclass) NOT NULL,
    x character varying(255) NOT NULL,
    linkedin character varying(255) NOT NULL,
    instagram character varying(255) NOT NULL,
    github character varying(255) NOT NULL,
    website character varying(255) NOT NULL,
    last_update timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.media OWNER TO linhle;

--
-- Name: flashcard_flashcard_id_seq; Type: SEQUENCE; Schema: public; Owner: linhle
--

CREATE SEQUENCE public.flashcard_flashcard_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.flashcard_flashcard_id_seq OWNER TO linhle;

--
-- Name: actor; Type: TABLE; Schema: public; Owner: linhle
--

CREATE TABLE public.flashcard (
    flashcard_id integer DEFAULT nextval('public.flashcard_flashcard_id_seq'::regclass) NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    subcard_id smallint[] NOT NULL, 
    last_update timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.flashcard OWNER TO linhle;

--
-- Name: subcard_subcard_id_seq; Type: SEQUENCE; Schema: public; Owner: linhle
--

CREATE SEQUENCE public.subcard_subcard_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.subcard_subcard_id_seq OWNER TO linhle;

--
-- Name: subcard; Type: TABLE; Schema: public; Owner: linhle
--

CREATE TABLE public.subcard (
    subcard_id integer DEFAULT nextval('public.subcard_subcard_id_seq'::regclass) NOT NULL,
    term text NOT NULL,
    definition text NOT NULL,
    subcard_image character varying(255),
    last_update timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.subcard OWNER TO linhle;

--
-- Name: tag_tag_id_seq; Type: SEQUENCE; Schema: public; Owner: linhle
--

CREATE SEQUENCE public.tag_tag_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tag_tag_id_seq OWNER TO linhle;

--
-- Name: tag; Type: TABLE; Schema: public; Owner: linhle
--

CREATE TABLE public.tag (
    tag_id integer DEFAULT nextval('public.tag_tag_id_seq'::regclass) NOT NULL,
    name character varying(25) NOT NULL,
    last_update timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tag OWNER TO linhle;


--
-- Name: creator_info; Type: VIEW; Schema: public; Owner: linhle
--

CREATE VIEW public.creator_info AS
    SELECT DISTINCT creator_id, first_name, last_name, email, create_date, c.last_update,
        active, country FROM public.creator c 
        INNER JOIN public.country ON c.country_id = country.country_id
        ORDER BY first_name, last_name;

ALTER TABLE public.creator_info OWNER TO linhle;

--
-- Name: city_city_id_seq; Type: SEQUENCE; Schema: public; Owner: linhle
--

CREATE SEQUENCE public.city_city_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.city_city_id_seq OWNER TO linhle;

--
-- Name: city; Type: TABLE; Schema: public; Owner: linhle
--

CREATE TABLE public.city (
    city_id integer DEFAULT nextval('public.city_city_id_seq'::regclass) NOT NULL,
    city character varying(50) NOT NULL,
    country_id smallint NOT NULL,
    last_update timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.city OWNER TO linhle;

--
-- Name: country_country_id_seq; Type: SEQUENCE; Schema: public; Owner: linhle
--

CREATE SEQUENCE public.country_country_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.country_country_id_seq OWNER TO linhle;

--
-- Name: country; Type: TABLE; Schema: public; Owner: linhle
--

CREATE TABLE public.country (
    country_id integer DEFAULT nextval('public.country_country_id_seq'::regclass) NOT NULL,
    country character varying(50) NOT NULL,
    last_update timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.country OWNER TO linhle;

--
-- Name: language_language_id_seq; Type: SEQUENCE; Schema: public; Owner: linhle
--

CREATE SEQUENCE public.language_language_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.language_language_id_seq OWNER TO linhle;

--
-- Name: language; Type: TABLE; Schema: public; Owner: linhle
--

CREATE TABLE public.language (
    language_id integer DEFAULT nextval('public.language_language_id_seq'::regclass) NOT NULL,
    name character(20) NOT NULL,
    last_update timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.language OWNER TO linhle;

--
-- Name: flashcard_tag; Type: TABLE; Schema: public; Owner: linhle
--

CREATE TABLE public.flashcard_tag (
    flashcard_id smallint NOT NULL,
    tag_id smallint NOT NULL
);

ALTER TABLE public.flashcard_tag OWNER TO linhle;

--
-- Data for Name: city; Type: TABLE DATA; Schema: public; Owner: linhle
--

COPY public.city (city_id, city, country_id, last_update) FROM stdin;
\.
COPY public.city (city_id, city, country_id, last_update) FROM '$$PATH$$/3067.dat';

--
-- Data for Name: country; Type: TABLE DATA; Schema: public; Owner: linhle
--

COPY public.country (country_id, country, last_update) FROM stdin;
\.
COPY public.country (country_id, country, last_update) FROM '$$PATH$$/3069.dat';

--
-- Data for Name: creator; Type: TABLE DATA; Schema: public; Owner: linhle
--

COPY public.creator (creator_id, first_name, last_name, email, language_id, country_id, media_id, flashcard_id, password, image, phone, about_me, create_date, last_update, active) FROM stdin;
\.
COPY public.creator (creator_id, first_name, last_name, email, language_id, country_id, media_id, flashcard_id, password, image, phone, about_me, create_date, last_update, active) FROM '$$PATH$$/3055.dat';

--
-- Data for Name: flashcard; Type: TABLE DATA; Schema: public; Owner: linhle
--

COPY public.flashcard (flashcard_id, title, description, tag_id, subcard_id, last_update) FROM stdin;
\.
COPY public.flashcard (flashcard_id, title, description, tag_id, subcard_id, last_update) FROM '$$PATH$$/3063.dat';

--
-- Data for Name: tag; Type: TABLE DATA; Schema: public; Owner: linhle
--

COPY public.tag (tag_id, flashcard_id, name, last_update) FROM stdin;
\.
COPY public.tag (tag_id, flashcard_id, name, last_update) FROM '$$PATH$$/3071.dat';

--
-- Data for Name: language; Type: TABLE DATA; Schema: public; Owner: linhle
--

COPY public.language (language_id, name, last_update) FROM stdin;
\.
COPY public.language (language_id, name, last_update) FROM '$$PATH$$/3073.dat';

--
-- Data for Name: media; Type: TABLE DATA; Schema: public; Owner: linhle
--

COPY public.media (media_id, x, linkedin, instagram, github, website, last_update) FROM stdin;
\.
COPY public.media (media_id, x, linkedin, instagram, github, website, last_update) FROM '$$PATH$$/3073.dat';

--
-- Name: creator_creator_id_seq; Type: SEQUENCE SET; Schema: public; Owner: linhle
--

SELECT pg_catalog.setval('public.creator_creator_id_seq', 200, true);


--
-- Name: media_media_id_seq; Type: SEQUENCE SET; Schema: public; Owner: linhle
--

SELECT pg_catalog.setval('public.media_media_id_seq', 605, true);


--
-- Name: flashcard_flashcard_id_seq; Type: SEQUENCE SET; Schema: public; Owner: linhle
--

SELECT pg_catalog.setval('public.flashcard_flashcard_id_seq', 605, true);

--
-- Name: subcard_subcard_id_seq; Type: SEQUENCE SET; Schema: public; Owner: linhle
--

SELECT pg_catalog.setval('public.subcard_subcard_id_seq', 605, true);


--
-- Name: city_city_id_seq; Type: SEQUENCE SET; Schema: public; Owner: linhle
--

SELECT pg_catalog.setval('public.city_city_id_seq', 600, true);


--
-- Name: country_country_id_seq; Type: SEQUENCE SET; Schema: public; Owner: linhle
--

SELECT pg_catalog.setval('public.country_country_id_seq', 109, true);


--
-- Name: tag_tag_id_seq; Type: SEQUENCE SET; Schema: public; Owner: linhle
--

SELECT pg_catalog.setval('public.tag_tag_id_seq', 1000, true);

--
-- Name: language_language_id_seq; Type: SEQUENCE SET; Schema: public; Owner: linhle
--

SELECT pg_catalog.setval('public.language_language_id_seq', 6, true);

--
-- Name: creator creator_pkey; Type: CONSTRAINT; Schema: public; Owner: linhle
--

ALTER TABLE ONLY public.creator
    ADD CONSTRAINT creator_pkey PRIMARY KEY (creator_id, language_id, country_id);


--
-- Name: city city_pkey; Type: CONSTRAINT; Schema: public; Owner: linhle
--

ALTER TABLE ONLY public.city
    ADD CONSTRAINT city_pkey PRIMARY KEY (city_id);

--
-- Name: media media_pkey; Type: CONSTRAINT; Schema: public; Owner: linhle
--
ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_pkey PRIMARY KEY (media_id);


--
-- Name: country country_pkey; Type: CONSTRAINT; Schema: public; Owner: linhle
--

ALTER TABLE ONLY public.country
    ADD CONSTRAINT country_pkey PRIMARY KEY (country_id);


--
-- Name: flashcard flashcard_pkey; Type: CONSTRAINT; Schema: public; Owner: linhle
--

ALTER TABLE ONLY public.flashcard
    ADD CONSTRAINT flashcard_pkey PRIMARY KEY (flashcard_id);

--
-- Name: subcard subcard_pkey; Type: CONSTRAINT; Schema: public; Owner: linhle
--

ALTER TABLE ONLY public.subcard
    ADD CONSTRAINT subcard_pkey PRIMARY KEY (subcard_id);

--
-- Name: tag tag_pkey; Type: CONSTRAINT; Schema: public; Owner: linhle
--

ALTER TABLE ONLY public.tag
    ADD CONSTRAINT tag_pkey PRIMARY KEY (tag_id);

--
-- Name: flashcard_tag flashcard_tag_pkey; Type: CONSTRAINT; Schema: public; Owner: linhle
--

ALTER TABLE ONLY public.flashcard_tag
    ADD CONSTRAINT flashcard_tag_pkey PRIMARY KEY (flashcard_id, tag_id);

--
-- Name: language language_pkey; Type: CONSTRAINT; Schema: public; Owner: linhle
--

ALTER TABLE ONLY public.language
    ADD CONSTRAINT language_pkey PRIMARY KEY (language_id);


--
-- Name: idx_creator_email; Type: INDEX; Schema: public; Owner: linhle
--

CREATE INDEX idx_creator_email ON public.creator USING btree (email);


--
-- Name: idx_fk_media_id; Type: INDEX; Schema: public; Owner: linhle
--

CREATE INDEX idx_fk_media_id ON public.media USING btree (media_id);

--
-- Name: idx_fk_flashcard_id; Type: INDEX; Schema: public; Owner: linhle
--

CREATE INDEX idx_fk_flashcard_id ON public.flashcard USING btree (flashcard_id);

--
-- Name: idx_fk_subcard_id; Type: INDEX; Schema: public; Owner: linhle
--

CREATE INDEX idx_fk_subcard_id ON public.subcard USING btree (subcard_id);


--
-- Name: idx_fk_city_id; Type: INDEX; Schema: public; Owner: linhle
--

CREATE INDEX idx_fk_city_id ON public.city USING btree (city_id);


--
-- Name: idx_fk_country_id; Type: INDEX; Schema: public; Owner: linhle
--

CREATE INDEX idx_fk_country_id ON public.country USING btree (country_id);


--
-- Name: idx_fk_tag_id; Type: INDEX; Schema: public; Owner: linhle
--

CREATE INDEX idx_fk_tag_id ON public.tag USING btree (tag_id);

--
-- Name: idx_fk_language_id; Type: INDEX; Schema: public; Owner: linhle
--

CREATE INDEX idx_fk_language_id ON public.language USING btree (language_id);

--
-- Name: creator last_updated; Type: TRIGGER; Schema: public; Owner: linhle
--

CREATE TRIGGER last_updated BEFORE UPDATE ON public.creator FOR EACH ROW EXECUTE PROCEDURE public.last_updated();


--
-- Name: flashcard last_updated; Type: TRIGGER; Schema: public; Owner: linhle
--

CREATE TRIGGER last_updated BEFORE UPDATE ON public.flashcard FOR EACH ROW EXECUTE PROCEDURE public.last_updated();

--
-- Name: subcard last_updated; Type: TRIGGER; Schema: public; Owner: linhle
--

CREATE TRIGGER last_updated BEFORE UPDATE ON public.subcard FOR EACH ROW EXECUTE PROCEDURE public.last_updated();


--
-- Name: tag last_updated; Type: TRIGGER; Schema: public; Owner: linhle
--

CREATE TRIGGER last_updated BEFORE UPDATE ON public.tag FOR EACH ROW EXECUTE PROCEDURE public.last_updated();


--
-- Name: city last_updated; Type: TRIGGER; Schema: public; Owner: linhle
--

CREATE TRIGGER last_updated BEFORE UPDATE ON public.city FOR EACH ROW EXECUTE PROCEDURE public.last_updated();


--
-- Name: country last_updated; Type: TRIGGER; Schema: public; Owner: linhle
--

CREATE TRIGGER last_updated BEFORE UPDATE ON public.country FOR EACH ROW EXECUTE PROCEDURE public.last_updated();


--
-- Name: language last_updated; Type: TRIGGER; Schema: public; Owner: linhle
--

CREATE TRIGGER last_updated BEFORE UPDATE ON public.language FOR EACH ROW EXECUTE PROCEDURE public.last_updated();


--
-- Name: media last_updated; Type: TRIGGER; Schema: public; Owner: linhle
--

CREATE TRIGGER last_updated BEFORE UPDATE ON public.media FOR EACH ROW EXECUTE PROCEDURE public.last_updated();


--
-- Name: creator creator_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: linhle
--

ALTER TABLE ONLY public.creator
    ADD CONSTRAINT creator_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.country(country_id) ON UPDATE CASCADE ON DELETE RESTRICT;

--
-- Name: creator creator_language_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: linhle
--

ALTER TABLE ONLY public.creator
    ADD CONSTRAINT creator_language_id_fkey FOREIGN KEY (language_id) REFERENCES public.language(language_id) ON UPDATE CASCADE ON DELETE RESTRICT;

--
-- Name: creator creator_media_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: linhle
--

ALTER TABLE ONLY public.creator
    ADD CONSTRAINT creator_media_id_fkey FOREIGN KEY (media_id) REFERENCES public.media(media_id) ON UPDATE CASCADE ON DELETE RESTRICT;

--
-- Name: city fk_city; Type: FK CONSTRAINT; Schema: public; Owner: linhle
--

ALTER TABLE ONLY public.city
    ADD CONSTRAINT fk_city FOREIGN KEY (country_id) REFERENCES public.country(country_id);

--
-- Name: flashcard flashcard_flashcard_id_unique; Type: FK CONSTRAINT UNIQUE; Schema: public; Owner: linhle
--
ALTER TABLE ONLY public.flashcard ADD CONSTRAINT flashcard_flashcard_id_unique UNIQUE (flashcard_id);

--
-- Name: creator creator_flashcard_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: linhle
--

ALTER TABLE ONLY public.creator
    ADD CONSTRAINT creator_flashcard_id_fkey FOREIGN KEY (flashcard_id) REFERENCES public.flashcard(flashcard_id) ON UPDATE CASCADE ON DELETE RESTRICT;

--
-- Name: tag tag_tag_id_fkey; Type: FK CONSTRAINT UNIQUE; Schema: public; Owner: linhle
--
ALTER TABLE ONLY public.tag ADD CONSTRAINT tag_tag_id_unique UNIQUE (tag_id);

--
-- Name: flashcard flashcard_subcard_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: linhle
--  
ALTER TABLE ONLY public.flashcard
    ADD CONSTRAINT flashcard_subcard_id_fkey FOREIGN KEY (subcard_id) REFERENCES public.subcard(subcard_id) ON UPDATE CASCADE ON DELETE RESTRICT;

--
-- Name: flashcard_tag flashcard_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: linhle
--

ALTER TABLE ONLY public.flashcard_tag
    ADD CONSTRAINT flashcard_tag_id_fkey FOREIGN KEY (flashcard_id) REFERENCES public.flashcard(flashcard_id) ON UPDATE CASCADE ON DELETE RESTRICT;

--
-- Name: flashcard_tag flashcard_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: linhle
--

ALTER TABLE ONLY public.flashcard_tag
    ADD CONSTRAINT tag_flashcard_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tag(tag_id) ON UPDATE CASCADE ON DELETE RESTRICT;

--
-- linhleQL database dump complete
--

