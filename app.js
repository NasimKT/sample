const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // For password hashing
const app = express();
const port = 3000;
const validation = require('./validation'); // Import the validation module

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mydb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Create a User schema and model
const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
});

const User = mongoose.model('users', UserSchema);

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.render('login');
});

app.get('/signin', (req, res) => {
  res.render('signin');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  let emailError = '';
  let passwordError = '';

  // Check if the username is a valid email using the validateEmail function from the validation module
  if (!validation.validateEmail(email)) {
    emailError = 'Invalid email address';
  }

  // Validate the password using the isPasswordValid function from the validation module
  const passwordValidationResult = validation.isPasswordValid(password);
  if (passwordValidationResult) {
    passwordError = passwordValidationResult;
  }

  // If there are errors, render the login page with the error messages
  if (emailError || passwordError) {
    return res.render('login', { emailError, passwordError });
  }

  // Check if the email and password exist in the database
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      emailError = 'Email or password is incorrect';
      return res.render('login', { emailError });
    }

    // Compare the provided password with the hashed password stored in the database
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      passwordError = 'Email or password is incorrect';
      return res.render('login', { passwordError });
    }
  } catch (error) {
    console.error(error);
    // Handle database error
    return res.status(500).send('Internal Server Error');
  }

  // Redirect to the home page on successful login
  res.redirect('/home');
});

app.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  let emailError = '';
  let passwordError = '';

  // Check if the username is a valid email using the validateEmail function from the validation module
  if (!validation.validateEmail(email)) {
    emailError = 'Invalid email address';
  }

  // Validate the password using the isPasswordValid function from the validation module
  const passwordValidationResult = validation.isPasswordValid(password);
  if (passwordValidationResult) {
    passwordError = passwordValidationResult;
  }

  // If there are errors, render the sign-in page with the error messages
  if (emailError || passwordError) {
    return res.render('signin', { emailError, passwordError });
  }

  // Check if the email already exists in the database
  try {
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      emailError = 'Email already exists';
      return res.render('signin', { emailError });
    }

    // Hash the password before saving it to the database
    const hashedPassword = await bcrypt.hash(password, 10); // Use bcrypt for hashing
    const newUser = new User({ email: email, password: hashedPassword });
    await newUser.save();
  } catch (error) {
    console.error(error);
    // Handle database error
    return res.status(500).send('Internal Server Error');
  }

  // Redirect to the home page on successful sign-in
  res.redirect('/home');
});

app.get('/home', (req, res) => {
  res.render('home');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

