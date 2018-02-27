CREATE TABLE users (
  id serial PRIMARY KEY,
  username character varying(50) NOT NULL,
  password character varying(60) NOT NULL, 
  name text NOT NULL,
  imgurl text
);

CREATE TABLE categories (
  id serial PRIMARY KEY,
  title character varying(50) NOT NULL
);

CREATE TABLE books (
  id serial PRIMARY KEY,
  title character varying(50) NOT NULL,
  ISBN13 character varying(13) NOT NULL, 
  author character varying(50),
  description text, 
  categoryId int REFERENCES categories (id)
);

CREATE TABLE readbooks (
  id serial PRIMARY KEY,
  userId int REFERENCES users (id) NOT NULL,
  bookId int REFERENCES books(id) NOT NULL,
  grade int NOT NULL,
  review text
);
