const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

// Fake bar data (mock Yelp API)
const barsDB = {
  belgrade: [
    { id: '1', name: 'Jazz Kafana' },
    { id: '2', name: 'Rock Cafe' },
    { id: '3', name: 'Night Owl Bar' }
  ],
  newyork: [
    { id: '4', name: 'NY Rooftop Bar' },
    { id: '5', name: 'Brooklyn Lounge' }
  ]
};

// Track who is going
let attendance = {}; // { barId: [username, ...] }

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));

// Home page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Login
app.post('/login', (req, res) => {
  const { username } = req.body;
  req.session.user = username;
  if (req.session.lastSearch) {
    return res.redirect(`/search?city=${req.session.lastSearch}`);
  }
  res.redirect('/');
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// Search by city
app.get('/search', (req, res) => {
  const city = req.query.city?.toLowerCase();
  req.session.lastSearch = city;
  const bars = barsDB[city];

  if (!bars) {
    return res.send(`No bars found for "${city}". Try "belgrade" or "newyork".`);
  }

  res.render('bars', {
    bars,
    attendance,
    user: req.session.user
  });
});

// Mark user as going to bar
app.post('/going/:barId', (req, res) => {
  if (!req.session.user) return res.status(401).send('Login required');
  const { barId } = req.params;

  attendance[barId] = attendance[barId] || [];
  if (!attendance[barId].includes(req.session.user)) {
    attendance[barId].push(req.session.user);
  }

  res.redirect('back');
});

// Remove user from bar attendance
app.post('/notgoing/:barId', (req, res) => {
  if (!req.session.user) return res.status(401).send('Login required');
  const { barId } = req.params;

  attendance[barId] = (attendance[barId] || []).filter(u => u !== req.session.user);
  res.redirect('back');
});

app.listen(PORT, () => console.log(`App running at http://localhost:${PORT}`));
