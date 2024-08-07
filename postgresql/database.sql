DROP DATABASE flash_card_app_nodejs;
--
-- Name: pernflashcard; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE flash_card_app_nodejs WITH TEMPLATE = template0 ENCODING = 'UTF8';


ALTER DATABASE flash_card_app_nodejs OWNER TO postgres;

\connect flash_card_app_nodejs

--
-- Name: year; Type: DOMAIN; Schema: public; Owner: postgres
--

CREATE DOMAIN public.year AS integer
	CONSTRAINT year_check CHECK (((VALUE >= 1901) AND (VALUE <= 2155)));


ALTER DOMAIN public.year OWNER TO postgres;

--
-- Name: _group_concat(text, text); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public._group_concat(text, text) OWNER TO postgres;

--
-- Name: last_day(timestamp without time zone); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.last_day(timestamp without time zone) OWNER TO postgres;

--
-- Name: last_updated(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.last_updated() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.last_update = CURRENT_TIMESTAMP;
    RETURN NEW;
END $$;


ALTER FUNCTION public.last_updated() OWNER TO postgres;

--
-- Name: creator_creator_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.creator_creator_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.creator_creator_id_seq OWNER TO postgres;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: creator; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.creator (
    creator_id integer DEFAULT nextval('public.creator_creator_id_seq'::regclass) NOT NULL,
    first_name character varying(45) NOT NULL,
    last_name character varying(45) NOT NULL,
    email character varying(50) NOT NULL UNIQUE,
    country_id smallint NOT NULL,
    language_id smallint NOT NULL,
    media_id smallint UNIQUE,
    flashcard_id smallint[] UNIQUE,
    password character varying(255) NOT NULL,
    image character varying(255) NOT NULL,
    about_me text,
    phone character varying(15),
    create_date date DEFAULT ('now'::text)::date NOT NULL,
    last_update timestamp without time zone DEFAULT now(),
    active integer
);


ALTER TABLE public.creator OWNER TO postgres;

--
-- Name: group_concat(text); Type: AGGREGATE; Schema: public; Owner: postgres
--

CREATE AGGREGATE public.group_concat(text) (
    SFUNC = public._group_concat,
    STYPE = text
);


ALTER AGGREGATE public.group_concat(text) OWNER TO postgres;

--
-- Name: media_media_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.media_media_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.media_media_id_seq OWNER TO postgres;

--
-- Name: media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.media (
    media_id integer DEFAULT nextval('public.media_media_id_seq'::regclass) NOT NULL,
    x character varying(255) NOT NULL,
    linkedin character varying(255) NOT NULL,
    instagram character varying(255) NOT NULL,
    github character varying(255) NOT NULL,
    website character varying(255) NOT NULL,
    last_update timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.media OWNER TO postgres;

--
-- Name: flashcard_flashcard_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.flashcard_flashcard_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.flashcard_flashcard_id_seq OWNER TO postgres;

--
-- Name: actor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.flashcard (
    flashcard_id integer DEFAULT nextval('public.flashcard_flashcard_id_seq'::regclass) NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    subcard_id smallint[] NOT NULL UNIQUE, 
    last_update timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.flashcard OWNER TO postgres;

--
-- Name: subcard_subcard_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.subcard_subcard_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.subcard_subcard_id_seq OWNER TO postgres;

--
-- Name: subcard; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.subcard (
    subcard_id integer DEFAULT nextval('public.subcard_subcard_id_seq'::regclass) NOT NULL,
    term text NOT NULL,
    definition text NOT NULL,
    subcard_image character varying(255),
    last_update timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.subcard OWNER TO postgres;

--
-- Name: tag_tag_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tag_tag_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tag_tag_id_seq OWNER TO postgres;

--
-- Name: tag; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.tag (
    tag_id integer DEFAULT nextval('public.tag_tag_id_seq'::regclass) NOT NULL,
    name character varying(25) NOT NULL UNIQUE,
    last_update timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tag OWNER TO postgres;

--
-- Name: city_city_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.city_city_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.city_city_id_seq OWNER TO postgres;

--
-- Name: city; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.city (
    city_id integer DEFAULT nextval('public.city_city_id_seq'::regclass) NOT NULL,
    city character varying(50) NOT NULL UNIQUE,
    country_id smallint NOT NULL,
    last_update timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.city OWNER TO postgres;

--
-- Name: country_country_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.country_country_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.country_country_id_seq OWNER TO postgres;

--
-- Name: country; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.country (
    country_id integer DEFAULT nextval('public.country_country_id_seq'::regclass) NOT NULL,
    country character varying(50) NOT NULL UNIQUE,
    last_update timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.country OWNER TO postgres;

--
-- Name: language_language_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.language_language_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.language_language_id_seq OWNER TO postgres;

--
-- Name: language; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.language (
    language_id integer DEFAULT nextval('public.language_language_id_seq'::regclass) NOT NULL,
    name character(20) NOT NULL UNIQUE,
    last_update timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.language OWNER TO postgres;

--
-- Name: flashcard_tag; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.flashcard_tag (
    flashcard_id smallint NOT NULL,
    tag_id smallint NOT NULL
);

ALTER TABLE public.flashcard_tag OWNER TO postgres;


--
-- Name: creator_creator_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.creator_creator_id_seq', 200, true);


--
-- Name: media_media_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.media_media_id_seq', 600, true);


--
-- Name: flashcard_flashcard_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.flashcard_flashcard_id_seq', 605, true);

--
-- Name: subcard_subcard_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.subcard_subcard_id_seq', 605, true);


--
-- Name: city_city_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.city_city_id_seq', 600, true);


--
-- Name: country_country_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.country_country_id_seq', 110, true);


--
-- Name: tag_tag_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tag_tag_id_seq', 109, true);

--
-- Name: language_language_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.language_language_id_seq', 109, true);

--
-- Name: creator creator_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.creator
    ADD CONSTRAINT creator_pkey PRIMARY KEY (creator_id, language_id, country_id);


--
-- Name: city city_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.city
    ADD CONSTRAINT city_pkey PRIMARY KEY (city_id);

--
-- Name: media media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--
ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_pkey PRIMARY KEY (media_id);


--
-- Name: country country_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.country
    ADD CONSTRAINT country_pkey PRIMARY KEY (country_id);


--
-- Name: flashcard flashcard_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flashcard
    ADD CONSTRAINT flashcard_pkey PRIMARY KEY (flashcard_id);

--
-- Name: subcard subcard_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subcard
    ADD CONSTRAINT subcard_pkey PRIMARY KEY (subcard_id);

--
-- Name: tag tag_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tag
    ADD CONSTRAINT tag_pkey PRIMARY KEY (tag_id);

--
-- Name: flashcard_tag flashcard_tag_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flashcard_tag
    ADD CONSTRAINT flashcard_tag_pkey PRIMARY KEY (flashcard_id, tag_id);

--
-- Name: language language_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.language
    ADD CONSTRAINT language_pkey PRIMARY KEY (language_id);


--
-- Name: idx_creator_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_creator_email ON public.creator USING btree (email);


--
-- Name: idx_fk_media_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fk_media_id ON public.media USING btree (media_id);

--
-- Name: idx_fk_flashcard_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fk_flashcard_id ON public.flashcard USING btree (flashcard_id);

--
-- Name: idx_fk_subcard_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fk_subcard_id ON public.subcard USING btree (subcard_id);


--
-- Name: idx_fk_city_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fk_city_id ON public.city USING btree (city_id);


--
-- Name: idx_fk_country_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fk_country_id ON public.country USING btree (country_id);


--
-- Name: idx_fk_tag_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fk_tag_id ON public.tag USING btree (tag_id);

--
-- Name: idx_fk_language_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fk_language_id ON public.language USING btree (language_id);

--
-- Name: creator last_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER last_updated BEFORE UPDATE ON public.creator FOR EACH ROW EXECUTE PROCEDURE public.last_updated();


--
-- Name: flashcard last_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER last_updated BEFORE UPDATE ON public.flashcard FOR EACH ROW EXECUTE PROCEDURE public.last_updated();

--
-- Name: subcard last_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER last_updated BEFORE UPDATE ON public.subcard FOR EACH ROW EXECUTE PROCEDURE public.last_updated();


--
-- Name: tag last_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER last_updated BEFORE UPDATE ON public.tag FOR EACH ROW EXECUTE PROCEDURE public.last_updated();


--
-- Name: city last_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER last_updated BEFORE UPDATE ON public.city FOR EACH ROW EXECUTE PROCEDURE public.last_updated();


--
-- Name: country last_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER last_updated BEFORE UPDATE ON public.country FOR EACH ROW EXECUTE PROCEDURE public.last_updated();


--
-- Name: language last_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER last_updated BEFORE UPDATE ON public.language FOR EACH ROW EXECUTE PROCEDURE public.last_updated();


--
-- Name: media last_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER last_updated BEFORE UPDATE ON public.media FOR EACH ROW EXECUTE PROCEDURE public.last_updated();

-- Add foreign key constraint for country_id in the creator table
ALTER TABLE ONLY public.creator
    ADD CONSTRAINT creator_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.country(country_id) ON UPDATE CASCADE ON DELETE RESTRICT;

-- Add foreign key constraint for language_id in the creator table
ALTER TABLE ONLY public.creator
    ADD CONSTRAINT creator_language_id_fkey FOREIGN KEY (language_id) REFERENCES public.language(language_id) ON UPDATE CASCADE ON DELETE RESTRICT;

-- Add foreign key constraint for media_id in the creator table
ALTER TABLE ONLY public.creator
    ADD CONSTRAINT creator_media_id_fkey FOREIGN KEY (media_id) REFERENCES public.media(media_id) ON UPDATE CASCADE ON DELETE RESTRICT;

-- Add foreign key constraint for country_id in the city table
ALTER TABLE ONLY public.city
    ADD CONSTRAINT fk_city FOREIGN KEY (country_id) REFERENCES public.country(country_id);

-- Add unique constraint for flashcard_id in the flashcard table
ALTER TABLE ONLY public.flashcard 
    ADD CONSTRAINT flashcard_flashcard_id_unique UNIQUE (flashcard_id);

-- Add unique constraint for subcard_id in the flashcard table
ALTER TABLE ONLY public.flashcard 
    ADD CONSTRAINT flashcard_subcard_id_unique UNIQUE (subcard_id);

-- Add foreign key constraint for flashcard_id array in the creator table (using triggers for array columns)
-- See detailed implementation with triggers in the previous response

-- Add unique constraint for tag_id in the tag table
ALTER TABLE ONLY public.tag 
    ADD CONSTRAINT tag_tag_id_unique UNIQUE (tag_id);

-- Add foreign key constraint for subcard_id array in the flashcard table (using triggers for array columns)
-- See detailed implementation with triggers in the previous response

-- Add foreign key constraint for flashcard_id in the flashcard_tag table
ALTER TABLE ONLY public.flashcard_tag
    ADD CONSTRAINT flashcard_tag_flashcard_id_fkey FOREIGN KEY (flashcard_id) REFERENCES public.flashcard(flashcard_id) ON UPDATE CASCADE ON DELETE RESTRICT;

-- Add foreign key constraint for tag_id in the flashcard_tag table
ALTER TABLE ONLY public.flashcard_tag
    ADD CONSTRAINT flashcard_tag_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tag(tag_id) ON UPDATE CASCADE ON DELETE RESTRICT;

-- --
-- -- Check if flashcard ids exist
-- --
-- CREATE OR REPLACE FUNCTION check_flashcard_ids_exist()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     -- Check if all flashcard_ids exist in the flashcard table
--     PERFORM 1
--     FROM unnest(NEW.flashcard_id) AS f_id
--     WHERE NOT EXISTS (SELECT 1 FROM flashcard WHERE flashcard_id = f_id);

--     IF NOT FOUND THEN
--         RETURN NEW;
--     ELSE
--         RAISE EXCEPTION 'flashcard_id array contains values that do not exist in flashcard table';
--     END IF;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Trigger check flashcard ids when the creator create new card
-- CREATE TRIGGER check_flashcard_ids_trigger
-- BEFORE INSERT OR UPDATE ON creator
-- FOR EACH ROW
-- EXECUTE FUNCTION check_flashcard_ids_exist();

--
-- Check if subcard ids exist
--
CREATE OR REPLACE FUNCTION check_subcard_ids_exist()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if all subcard_ids exist in the subcard table
    PERFORM 1
    FROM unnest(NEW.subcard_id) AS f_id
    WHERE NOT EXISTS (SELECT 1 FROM subcard WHERE subcard_id = f_id);

    IF NOT FOUND THEN
        RETURN NEW;
    ELSE
        RAISE EXCEPTION 'subcard_id array contains values that do not exist in subcard table';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger check subcard ids when the flashcard create new card
CREATE TRIGGER check_subcard_ids_trigger
BEFORE INSERT OR UPDATE ON flashcard
FOR EACH ROW
EXECUTE FUNCTION check_subcard_ids_exist();

--
-- Check if language ids exist
--
CREATE OR REPLACE FUNCTION check_language_ids_exist()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the language_id exists in the language table
    IF NOT EXISTS (SELECT 1 FROM language WHERE language_id = NEW.language_id) THEN
        RAISE EXCEPTION 'language_id % does not exist in language table', NEW.language_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger check language ids when the creator create new card
CREATE TRIGGER check_language_ids_trigger
BEFORE INSERT OR UPDATE ON creator
FOR EACH ROW
EXECUTE FUNCTION check_language_ids_exist();

--
-- Check if country ids exist
--
CREATE OR REPLACE FUNCTION check_country_ids_exist()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the country_id exists in the country table
    IF NOT EXISTS (SELECT 1 FROM country WHERE country_id = NEW.country_id) THEN
        RAISE EXCEPTION 'country_id % does not exist in country table', NEW.country_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger check country ids when the creator create new card
CREATE TRIGGER check_country_ids_trigger
BEFORE INSERT OR UPDATE ON creator
FOR EACH ROW
EXECUTE FUNCTION check_country_ids_exist();

--
-- Check if media ids exist
--
CREATE OR REPLACE FUNCTION check_media_ids_exist()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the media_id exists in the media table
    IF NOT EXISTS (SELECT 1 FROM media WHERE media_id = NEW.media_id) THEN
        RAISE EXCEPTION 'media_id % does not exist in media table', NEW.media_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger check media ids when the creator create new card
CREATE TRIGGER check_media_ids_trigger
BEFORE INSERT OR UPDATE ON creator
FOR EACH ROW
EXECUTE FUNCTION check_media_ids_exist();

--
-- Delete related flashcards
--
CREATE OR REPLACE FUNCTION delete_related_flashcards()
RETURNS TRIGGER AS $$
DECLARE
    id smallint;
BEGIN
	IF OLD.flashcard_id IS NOT NULL THEN
	    FOREACH id IN ARRAY OLD.flashcard_id
	    LOOP
	        DELETE FROM flashcard WHERE flashcard_id = id;
	    END LOOP;
	END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Delete flashcards after creator delete
CREATE TRIGGER delete_flashcards_after_creator_delete
AFTER DELETE ON creator
FOR EACH ROW
EXECUTE FUNCTION delete_related_flashcards();

--
-- Delete related flashcards
--
CREATE OR REPLACE FUNCTION delete_related_creator()
RETURNS TRIGGER AS $$
BEGIN
    -- Update creator table to remove the flashcard_id from the array
    UPDATE creator 
    SET flashcard_id = array_remove(flashcard_id, OLD.flashcard_id)
    WHERE OLD.flashcard_id = ANY(flashcard_id);

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;


-- Delete flashcard ID from creator after flashcard delete
CREATE TRIGGER delete_creator_after_flashcard_delete
AFTER DELETE ON flashcard
FOR EACH ROW
EXECUTE FUNCTION delete_related_creator();


--
-- Delete related flashcards tag
--
CREATE OR REPLACE FUNCTION delete_related_flashcard_tags()
RETURNS TRIGGER AS $$
DECLARE
    id_element smallint;
BEGIN
    IF OLD.flashcard_id IS NOT NULL THEN
        DELETE FROM flashcard_tag WHERE flashcard_id = OLD.flashcard_id;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;


-- Delete flashcards tags after flashcard delete
CREATE TRIGGER delete_flashcard_tags_before_flashcard_delete
BEFORE DELETE ON flashcard
FOR EACH ROW
EXECUTE FUNCTION delete_related_flashcard_tags();

--
-- Delete related flashcards tag
--
CREATE OR REPLACE FUNCTION delete_related_tag_flashcard()
RETURNS TRIGGER AS $$
DECLARE
    id_element smallint;
BEGIN
    IF OLD.tag_id IS NOT NULL THEN
        DELETE FROM flashcard_tag WHERE tag_id = OLD.tag_id;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;


-- Delete flashcards tags after flashcard delete
CREATE TRIGGER delete_flashcard_tags_before_tag_delete
BEFORE DELETE ON tag
FOR EACH ROW
EXECUTE FUNCTION delete_related_tag_flashcard();

--
-- Delete related subcard tag
--
CREATE OR REPLACE FUNCTION delete_related_subcards()
RETURNS TRIGGER AS $$
DECLARE
    id_element smallint;
BEGIN
    IF OLD.subcard_id IS NOT NULL THEN
        FOREACH id_element IN ARRAY OLD.subcard_id
        LOOP
            DELETE FROM subcard WHERE subcard_id = id_element;
        END LOOP;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Delete flashcards tags after flashcard delete
CREATE TRIGGER delete_subcards_before_flashcard_delete
BEFORE DELETE ON flashcard
FOR EACH ROW
EXECUTE FUNCTION delete_related_subcards();

--
-- Delete related creator media
--
CREATE OR REPLACE FUNCTION delete_related_creator_media()
RETURNS TRIGGER AS $$
DECLARE
    id_element smallint;
BEGIN
    IF OLD.media_id IS NOT NULL THEN
        DELETE FROM media WHERE media_id = OLD.media_id;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;


-- Delete media after creator delete
CREATE TRIGGER delete_media_after_creator_delete
AFTER DELETE ON creator
FOR EACH ROW
EXECUTE FUNCTION delete_related_creator_media();

--
-- Insert countries in SQL
--
INSERT INTO country (country)
VALUES
('Afghanistan'),
('Albania'),
('Algeria'),
('Andorra'),
('Angola'),
('Antigua and Barbuda'),
('Argentina'),
('Armenia'),
('Australia'),
('Austria'),
('Azerbaijan'),
('Bahamas'),
('Bahrain'),
('Bangladesh'),
('Barbados'),
('Belarus'),
('Belgium'),
('Belize'),
('Benin'),
('Bhutan'),
('Bolivia'),
('Bosnia and Herzegovina'),
('Botswana'),
('Brazil'),
('Brunei'),
('Bulgaria'),
('Burkina Faso'),
('Burundi'),
('Cabo Verde'),
('Cambodia'),
('Cameroon'),
('Canada'),
('Central African Republic'),
('Chad'),
('Chile'),
('China'),
('Colombia'),
('Comoros'),
('Congo'),
('Costa Rica'),
('Croatia'),
('Cuba'),
('Cyprus'),
('Czech Republic'),
('Denmark'),
('Djibouti'),
('Dominica'),
('Dominican Republic'),
('East Timor'),
('Ecuador'),
('Egypt'),
('El Salvador'),
('Equatorial Guinea'),
('Eritrea'),
('Estonia'),
('Eswatini'),
('Ethiopia'),
('Fiji'),
('Finland'),
('France'),
('Gabon'),
('Gambia'),
('Georgia'),
('Germany'),
('Ghana'),
('Greece'),
('Grenada'),
('Guatemala'),
('Guinea'),
('Guinea-Bissau'),
('Guyana'),
('Haiti'),
('Honduras'),
('Hungary'),
('Iceland'),
('India'),
('Indonesia'),
('Iran'),
('Iraq'),
('Ireland'),
('Israel'),
('Italy'),
('Jamaica'),
('Japan'),
('Jordan'),
('Kazakhstan'),
('Kenya'),
('Kiribati'),
('Korea, North'),
('Korea, South'),
('Kosovo'),
('Kuwait'),
('Kyrgyzstan'),
('Laos'),
('Latvia'),
('Lebanon'),
('Lesotho'),
('Liberia'),
('Libya'),
('Liechtenstein'),
('Lithuania'),
('Luxembourg'),
('Madagascar'),
('Malawi'),
('Malaysia'),
('Maldives'),
('Mali'),
('Malta'),
('Marshall Islands'),
('Mauritania'),
('Mauritius'),
('Mexico'),
('Micronesia'),
('Moldova'),
('Monaco'),
('Mongolia'),
('Montenegro'),
('Morocco'),
('Mozambique'),
('Myanmar'),
('Namibia'),
('Nauru'),
('Nepal'),
('Netherlands'),
('New Zealand'),
('Nicaragua'),
('Niger'),
('Nigeria'),
('North Macedonia'),
('Norway'),
('Oman'),
('Pakistan'),
('Palau'),
('Palestinian Territories'),
('Panama'),
('Papua New Guinea'),
('Paraguay'),
('Peru'),
('Philippines'),
('Poland'),
('Portugal'),
('Qatar'),
('Romania'),
('Russia'),
('Rwanda'),
('Saint Kitts and Nevis'),
('Saint Lucia'),
('Saint Vincent and the Grenadines'),
('Samoa'),
('San Marino'),
('Sao Tome and Principe'),
('Saudi Arabia'),
('Senegal'),
('Serbia'),
('Seychelles'),
('Sierra Leone'),
('Singapore'),
('Slovakia'),
('Slovenia'),
('Solomon Islands'),
('Somalia'),
('South Africa'),
('South Sudan'),
('Spain'),
('Sri Lanka'),
('Sudan'),
('Suriname'),
('Sweden'),
('Switzerland'),
('Syria'),
('Taiwan'),
('Tajikistan'),
('Tanzania'),
('Thailand'),
('Togo'),
('Tonga'),
('Trinidad and Tobago'),
('Tunisia'),
('Turkey'),
('Turkmenistan'),
('Tuvalu'),
('Uganda'),
('Ukraine'),
('United Arab Emirates'),
('United Kingdom'),
('United States'),
('Uruguay'),
('Uzbekistan'),
('Vanuatu'),
('Vatican City'),
('Venezuela'),
('Vietnam'),
('Yemen'),
('Zambia'),
('Zimbabwe');

--
-- Insert languages into the SQL
--
INSERT INTO language (name)
VALUES
('Afrikaans'),
('Albanian'),
('Amharic'),
('Arabic'),
('Armenian'),
('Azerbaijani'),
('Basque'),
('Belarusian'),
('Bengali'),
('Bosnian'),
('Bulgarian'),
('Catalan'),
('Cebuano'),
('Chinese'),
('Corsican'),
('Croatian'),
('Czech'),
('Danish'),
('Dutch'),
('English'),
('Esperanto'),
('Estonian'),
('Finnish'),
('French'),
('Frisian'),
('Galician'),
('Georgian'),
('German'),
('Greek'),
('Gujarati'),
('Haitian Creole'),
('Hausa'),
('Hawaiian'),
('Hebrew'),
('Hindi'),
('Hmong'),
('Hungarian'),
('Icelandic'),
('Igbo'),
('Indonesian'),
('Irish'),
('Italian'),
('Japanese'),
('Javanese'),
('Kannada'),
('Kazakh'),
('Khmer'),
('Kinyarwanda'),
('Korean'),
('Kurdish'),
('Kyrgyz'),
('Lao'),
('Latin'),
('Latvian'),
('Lithuanian'),
('Luxembourgish'),
('Macedonian'),
('Malagasy'),
('Malay'),
('Malayalam'),
('Maltese'),
('Maori'),
('Marathi'),
('Mongolian'),
('Myanmar (Burmese)'),
('Nepali'),
('Norwegian'),
('Nyanja (Chichewa)'),
('Odia (Oriya)'),
('Pashto'),
('Persian'),
('Polish'),
('Portuguese'),
('Punjabi'),
('Romanian'),
('Russian'),
('Samoan'),
('Scots Gaelic'),
('Serbian'),
('Sesotho'),
('Shona'),
('Sindhi'),
('Sinhala (Sinhalese)'),
('Slovak'),
('Slovenian'),
('Somali'),
('Spanish'),
('Sundanese'),
('Swahili'),
('Swedish'),
('Tagalog (Filipino)'),
('Tajik'),
('Tamil'),
('Tatar'),
('Telugu'),
('Thai'),
('Turkish'),
('Turkmen'),
('Ukrainian'),
('Urdu'),
('Uyghur'),
('Uzbek'),
('Vietnamese'),
('Welsh'),
('Xhosa'),
('Yiddish'),
('Yoruba'),
('Zulu');


--
-- postgresQL database dump complete
--

