CREATE TABLE users (
  id serial primary key,
  username character varying(50) NOT NULL,
  password character varying(50) NOT NULL, 
  name text NOT NULL,
  imgurl text, 
);

CREATE TABLE categories (
  id serial primary key,
  title character varying(50) NOT NULL,
);

CREATE TABLE books (
  id serial primary key,
  title character varying(50) NOT NULL,
  ISBN13 character varying(13) NOT NULL, 
  author character varying(50),
  description text, 
  category int FOREIGN KEY REFERENCES categories(id),
);

CREATE TABLE readbooks (
  id serial primary key,
  user int FOREIGN KEY REFERENCES users(id) NOT NULL,
  boook int FOREIGN KEY REFERENCES books(id) NOT NULL,
  grade int NOT NULL,
  review text, 
);
