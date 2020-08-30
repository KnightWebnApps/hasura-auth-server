# Restaurant Auth Server

Simple Auth Server For Signup &amp; Login Mutation

## Setup

1. npm install
2. Create public and private keys 
3. Change Business Details for token signature

**Required Schema**
Table Name: `User`

- id (uuid)
- email (string/text)
- password (string/text)

```PLpgSQL
CREATE TABLE public."user" (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    email text NOT NULL,
    password text NOT NULL
);

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);
    
ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);
```

**Queries**
```
me { email } // Used for login check
```

**Mutations**
```
login(email: String, password: String) { token }
signup(email: String, password: String) { token }
```
