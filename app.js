//importing required modules
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
const port = 3000;
const validation = require('./validation'); // Import the validation module
const session = require('express-session');


// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/mydb', {
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
const AdminSchema = new mongoose.Schema({
  email: String,
  password: String,
});
//accessing collection from db
const User = mongoose.model('users', UserSchema);
const admin = mongoose.model('admin', AdminSchema);
//setting up view-engine
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.render('login');
});

app.get('/signin', (req, res) => {
  res.render('signin');
});

app.get('/admin-login', (req, res) => {
  res.render('admin-login');
});

app.use(session({
  secret: 'my_session', // Change this to a strong, random secret
  resave: false,
  saveUninitialized: true,
}));

app.get('/admin', async (req, res) => {
  try {
    // Fetch all documents from the database
    const user = await User.find();

    // Render the EJS template and pass the data
    res.render('admin', { user });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching users');
  }
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
    if (!user || password !== user.password) {
      emailError = 'Email or password is incorrect';
      return res.render('login', { emailError });
    }

    // Extract the username from the email
    const username = (email.split('@')[0]).toUpperCase(); // Split by "@" and take the first part as the username

    // Store user information in the session
    req.session.user = { username, email: user.email }; // Store both username and email in the session

    res.redirect('/home');
  } catch (error) {
    console.error(error);
    // Handle database error
    return res.status(500).send('Internal Server Error');
  }
});


app.post('/admin-login', async (req, res) => {
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
    return res.render('admin-login', { emailError, passwordError });
  }

  // Check if the email and password exist in the database
  try {
    const user1 = await admin.findOne({ email: email });
    if (!user1) {
      emailError = 'Email or password is incorrect';
      return res.render('admin-login', { emailError });
    }

    if (password!=user1.password) {
      passwordError = 'Email or password is incorrect';
      return res.render('admin-login', { passwordError });
    }
  } catch (error) {
    console.error(error);
    // Handle database error
    return res.status(500).send('Internal Server Error');
  }

  res.redirect('/admin');
});

app.post('/search', async (req, res) => {
  const { email } = req.body;

  try {
    // Query the database to search for users with a matching email
    const user = await User.find({ email: email });

    // Render a page with the search results
    res.render('admin', { user });
  } catch (error) {
    console.error(error);
    // Handle database error
    res.status(500).send('Internal Server Error');
  }
});


app.post('/delete/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    // Find the user by ID and remove it from the database
    const deletedUser = await User.findByIdAndRemove(userId);

    if (!deletedUser) {
      // User not found
      return res.status(404).send('User not found');
    }

    // Redirect to a success page or refresh the user list
    res.redirect('/admin'); // You can change this to an appropriate page
  } catch (error) {
    console.error(error);
    // Handle database error
    res.status(500).send('Internal Server Error');
  }
});

app.post('/update/:id', async (req, res) => {
  const userId = req.params.id;
  const { email, password } = req.body;

  try {
    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      // User not found
      return res.status(404).send('User not found');
    }

    // Update user details
    user.email = email;
    user.password = password; // Make sure to hash the new password before saving

    await user.save();

    // Redirect to a success page or back to the user list
    res.redirect('/admin'); // You can change this to an appropriate page
  } catch (error) {
    console.error(error);
    // Handle database error
    res.status(500).send('Internal Server Error');
  }
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

    // Store the extracted username in the session
    const username = (email.split('@')[0]).toUpperCase();

    // password before saving it to the database
    const newUser = new User({ email: email, password: password });
    await newUser.save();

    // Set the session variable before redirecting
    req.session.username = username;
    
    // Redirect to the home page on successful sign-in
    return res.redirect('/home');
  } catch (error) {
    console.error(error);
    // Handle database error
    return res.status(500).send('Server Error');
  }
});



app.get('/home', async (req, res) => {
  try {
    // Check if the user is logged in by looking for user data in the session
    if (!req.session.user) {
      return res.redirect('/'); // Redirect to the login page if the user is not logged in
    }

    // Retrieve the user information from the session
    const user = req.session.user;

    // Render the EJS template and pass the username from the session to the template
    res.render('home', { username: user.username });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching user data');
  }
});



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});