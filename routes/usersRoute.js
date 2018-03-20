const express = require('express');
const cloudinary = require('cloudinary');
const multer = require('multer');
const {
  readAll,
  findById,
  update,
  updateImage,
} = require('../db/usersDb');

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

const router = express.Router();

function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

async function readAllUsers(req, res) {
  const result = await readAll();
  const usersWithoutPw = result.data.map((d) => {
    const { username, name } = d;
    const imgurl = d.imgurl || '';
    return { username, name, imgurl };
  });
  return res.json(usersWithoutPw);
}

async function getUserById(req, res) {
  const { id } = req.params;
  const user = await findById(id);
  if (user) {
    const {
      username,
      name,
      imgurl,
    } = user;
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
router.post('/me/profile', uploads.single('image'), catchErrors(uploadLoggedInUsersImage));

module.exports = router;
