# Init the backend

## Setup the database
The database **must have 3** tables.
```sql
create table
  public.quizzes (
    quizid text not null,
    name text null,
    data text null,
    needs_auth boolean null,
    constraint quizzes_pkey primary key (quizid),
    constraint quizzes_quizid_key unique (quizid)
  ) tablespace pg_default;
```

```sql
create table
  public.users (
    username text not null,
    password text null,
    email text null,
    role text null,
    constraint users_pkey primary key (username)
  ) tablespace pg_default;
```
