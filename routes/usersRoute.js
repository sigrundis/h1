const express = require('express');
const cloudinary = require('cloudinary');
const multer = require('multer');

const uploads = multer({ dest: './temp' });

const {
  CLOUDINARY_CLOUD,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

if (!CLOUDINARY_CLOUD || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.warn('Missing cloudinary config, uploading images will not work');
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});
const {
  readAll,
  findById,
  update,
  updateImage,
  findReadBooksByUserId,
  tempBookFind,
  createReadBook,
  getReadBookByBook,
  updateReadBook,
  findReadBookById,
  deleteReadBookById,
} = require('../db/usersDb');

const router = express.Router();

function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

async function readAllUsers(req, res) {
  const { offset = 0, limit = 10 } = req.query;
  const result = await readAll(offset, limit);

  const usersWithoutPw = result.result.data.items.map((d) => {
    const { username, name } = d;
    const imgurl = d.imgurl || '';
    return { username, name, imgurl };
  });
  const resultFinal = {
    limit: result.result.data.limit,
    offset: result.result.data.offset,
    items: usersWithoutPw,
    prev: result.result.data.prev,
    next: result.result.data.next,
  };
  return res.json(resultFinal);
}

async function getUserById(req, res) {
  const { id } = req.params;
  const user = await findById(id);
  if (user) {
    const { username, name, imgurl } = user;
    return res.json({
      id,
      username,
      name,
      imgurl,
    });
  }
  return res.status(404).json({ error: 'User not found' });
}

async function getLoggedInUser(req, res) {
  if (req.user) {
    const { username, name } = req.user;
    const imgurl = req.user.imgurl || '';
    return res.json({ username, name, imgurl });
  }
  return res.status(401).json({ error: 'You are not logged in' });
}

async function updateLoggedInUser(req, res) {
  const { password, name } = req.body;
  if (req.user) {
    const { id } = req.user;
    const result = await update({ id, password, name });
    if (!result.success) {
      return res.json(result.validation);
    }
    const updatedUser = result.data;
    updatedUser.imgurl = result.data.imgurl || '';
    return res.json(updatedUser);
  }
  return res.status(404).json({ error: 'You are not logged in' });
}

async function getLoggedInUserReadBooks(req, res) {
  if (req.user) {
    const { id } = req.user;
    const result = await findReadBooksByUserId({ id });
    return res.json(result.data);
  }
  return res.status(401).json({ error: 'You are not logged in' });
}

async function getReadBooksByUserId(req, res) {
  const { id } = req.params;

  // Queries behave badly if id is not parsable to string
  if (Number.isNaN(parseInt(id, 10))) {
    return res.status(404).json({ error: 'User not found' });
  }
  const user = await findById(id);

  // Check if user exists
  if (user) {
    const result = await findReadBooksByUserId({ id });
    return res.json(result.data);
  }
  return res.status(404).json({ error: 'User not found' });
}

async function setBookReadForUser(req, res) {
  const { bookId, grade, review = '' } = req.body;
  // Logged in
  if (req.user) {
    const { id } = req.user;

    // Check if book exists
    const book = await tempBookFind({ bookId });
    if (!book) {
      return res.status(404).json({ error: 'Book not found!' });
    }
    // Check if review exists
    const existingReview = await getReadBookByBook({ id, bookId });
    if (existingReview.data) {
      return res.status(405).json({ error: 'Review already exists.' });
    }

    const result = await createReadBook({
      id,
      bookId,
      grade,
      review,
    });

    if (!result.success) {
      return res.json(result.validation);
    }

    return res.status(201).json(result.data);
  }
  return res.status(404).json({ error: 'You are not logged in' });
}

async function updateBookReadForUser(req, res) {
  const { bookId, grade, review } = req.body;

  if (req.user) {
    const { id } = req.user;

    // Check if review exists
    const existingReview = await getReadBookByBook({ id, bookId });
    if (!existingReview.data) {
      return res.status(404).json({ error: 'Review does not exist.' });
    }

    // Send the updated data along with the old data
    const result = await updateReadBook(
      {
        id,
        bookId,
        grade,
        review,
      },
      existingReview.data,
    );

    if (!result.success) {
      return res.json(result.validation);
    }

    return res.status(201).json(result.data);
  }
  return res.status(401).json({ error: 'You are not logged in' });
}

async function deleteBookReadForUser(req, res) {
  const { id } = req.params;

  if (req.user) {
    // Queries behave badly if id is not parsable to string
    if (Number.isNaN(parseInt(id, 10))) {
      return res.status(404).json({ error: 'Book not found' });
    }
    const readBook = await findReadBookById(id);

    // Check if user exists
    if (readBook) {
      const result = await deleteReadBookById({ id });
      return res.json(result.data);
    }
    return res.status(404).json({ error: 'Book not found' });
  }
  return res.status(401).json({ error: 'You are not logged in' });
}

router.use((req, res, next) => {
  if (req.isAuthenticated()) {
    res.locals.user = req.user;
  }
  next();
});

async function uploadLoggedInUsersImage(req, res, next) {
  const { file: { path } = {} } = req;
  if (req.user) {
    if (!path) {
      return res.json({ error: 'Gat ekki lesið mynd' });
    }
    let upload = null;
    try {
      upload = await cloudinary.v2.uploader.upload(path);
    } catch (error) {
      console.error('Unable to upload file to cloudinary:', path);
      return next(error);
    }
    const { secure_url } = upload; // eslint-disable-line
    const { id } = req.user;
    const result = await updateImage({ id, imgurl: secure_url });
    if (!result.success) {
      return res.json(result.validation);
    }
    const updatedUser = result.data;
    updatedUser.imgurl = result.data.imgurl || '';
    return res.json(updatedUser);
  }
  return res.status(404).json({ error: 'You are not logged in' });
}

router.get('/', catchErrors(readAllUsers));
router.get('/me', catchErrors(getLoggedInUser));
router.patch('/me', catchErrors(updateLoggedInUser));
router.get('/:id', catchErrors(getUserById));
router.post(
  '/me/profile',
  uploads.single('image'),
  catchErrors(uploadLoggedInUsersImage),
);
router.get('/me/read', catchErrors(getLoggedInUserReadBooks));
router.post('/me/read', catchErrors(setBookReadForUser));
router.patch('/me/read', catchErrors(updateBookReadForUser));
router.delete('/me/read/:id', catchErrors(deleteBookReadForUser));
router.get('/:id/read', catchErrors(getReadBooksByUserId));

module.exports = router;
