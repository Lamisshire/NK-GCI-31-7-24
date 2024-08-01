const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors()); // Enable CORS for all routes

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Connect to SQLite Database (NEW)
let db = new sqlite3.Database('crm_database_UPDATED.db', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the SQLite database.');
});

// Create Tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS "Users" (
	"userID"	INTEGER,
	"firstName"	TEXT,
	"lastName"	TEXT,
	"email"	REAL,
	"phone"	NUMERIC,
	"address"	TEXT,
	"city"	TEXT,
	"state"	TEXT,
	"country"	TEXT,
	"postcode"	TEXT,
	"username"	TEXT,
	"password"	TEXT,
	"role"	TEXT,
	"createdAt"	TEXT,
	"departmendName"	TEXT,
	"businessID"	INTEGER,
	PRIMARY KEY("userID" AUTOINCREMENT),
	FOREIGN KEY("businessID") REFERENCES "Businesses"("businessID")
)`);

db.run(`CREATE TABLE IF NOT EXISTS "Businesses" (
	"businessID"	INTEGER,
  "businessName"	TEXT,
	"contactType"	TEXT,
	"contactDate"	TEXT,
	"notes"	TEXT,
	"createdAt"	TEXT,
	"userID"	INTEGER,
	PRIMARY KEY("businessID" AUTOINCREMENT),
	FOREIGN KEY("userID") REFERENCES "Users"("userID")
)`);




db.get('SELECT COUNT(*) AS count FROM Users', (err, row) => {
  if (err) {
    return console.error(err.message);
  }
  if (row.count === 0) {
    insertDummyUserData();
  }
});

db.get('SELECT COUNT(*) AS count FROM Businesses', (err, row) => {
  if (err) {
    return console.error(err.message);
  }
  if (row.count === 0) {
    insertDummyBusinessData();
  }
});

});


const insertDummyUserData = () => {
  const stmt = db.prepare(`INSERT INTO Users (
    firstName, lastName, email, phone, address, city, state, country, postcode,
    username, password, role, createdAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  
  for (let i = 1; i <= 5000; i++) {
    stmt.run(
      `First${i}`, `Last${i}`, `email${i}@example.com`, `1234567890`, `Address${i}`,
      `City${i}`, `State${i}`, `Country${i}`, `Postcode${i}`, `username${i}`,
      `password${i}`, `User`, new Date().toISOString()
    );
  }

  stmt.finalize();
};

const insertDummyBusinessData = () => {
    const stmt = db.prepare(`INSERT INTO Businesses (
      businessName, contactType, contactDate, notes, createdAt
    ) VALUES (?, ?, ?, ?, ?)`);
    
    for (let i = 1; i <= 50; i++) {
      stmt.run(
        `businessName${i}`, `contactType${i}`, `contactDate${i}`, `random note${i}`, new Date().toISOString()
      );
    }
  
    stmt.finalize();
   };

// Route to handle user login
// Routes for different user roles
// CRUD operations for Entities

// Get all entities
app.get('/Users', (req, res) => {
    db.all('SELECT * FROM Users', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Get all businesses
app.get('/Businesses', (req, res) => {
  db.all('SELECT * FROM Businesses', [], (err, rows) => {
      if (err) {
          return res.status(500).json({ error: err.message });
      }
      res.json(rows);
  });
});


// Get a single User
app.get('/Users/:id', (req, res) => {
    db.get('SELECT * FROM Users WHERE userID = ?', [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(row || {});
    });
});

// Get a single Business
app.get('/Businesses/:id', (req, res) => {
  db.get('SELECT * FROM Businesses WHERE BusinessID = ?', [req.params.id], (err, row) => {
      if (err) {
          return res.status(500).json({ error: err.message });
      }
      res.json(row || {});
  });
});

// Get all users with their associated business name
app.get('/Users', (req, res) => {
  const query = `
    SELECT Users.*, Businesses.businessName
    FROM Users
    LEFT JOIN Businesses ON Users.businessID = Businesses.businessID
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});


// Create a new User
app.post('/Users', (req, res) => {
  const {
      firstName, lastName, email, phone, address, city, state, country, postcode,
      username, password, role
  } = req.body;
  const createdAt = new Date().toISOString();
  
  // Prepare the SQL statement
  const stmt = db.prepare(`INSERT INTO Users (
      firstName, lastName, email, phone, address, city, state, country, postcode,
      username, password, role, createdAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  
  // Execute the SQL statement
  stmt.run([
      firstName, lastName, email, phone, address, city, state, country, postcode,
      username, password, role, createdAt
  ], function (err) {
      if (err) {
          console.error('Error saving user:', err.message); // Log the error
          return res.status(500).json({ success: false, message: 'Error creating user' });
      }
      res.json({ success: true, UserID: this.lastID });
  });
  
  // Finalize the statement
  stmt.finalize();
});


// Create a new Business
app.post('/Businesses', (req, res) => {
  const {
      businessName, contactType, contactDate, notes, 
  } = req.body;
  const createdAt = new Date().toISOString();
  
  // Prepare the SQL statement
  const stmt = db.prepare(`INSERT INTO BUSINESSES (
      businessName, contactType, contactDate, notes, createdAt
  ) VALUES (?, ?, ?, ?, ?)`);
  
  // Execute the SQL statement
  stmt.run([
    businessName, contactType, contactDate, notes, createdAt
  ], function (err) {
      if (err) {
          console.error('Error saving business:', err.message); // Log the error
          return res.status(500).json({ success: false, message: 'Error creating business' });
      }
      res.json({ success: true, BusinessID: this.lastID });
  });
  
  // Finalize the statement
  stmt.finalize();
});

// Update an existing user
app.put('/Users/:id', (req, res) => {
    const { firstName, lastName, email, phone, address, city, state, country, postcode, username, password, role } = req.body;
    const stmt = db.prepare(`UPDATE Users SET
        firstName = ?, lastName = ?, email = ?, phone = ?, address = ?, city = ?, state = ?, country = ?, postcode = ?, username = ?, password = ?, role = ?
        WHERE userID = ?`);
    stmt.run([firstName, lastName, email, phone, address, city, state, country, postcode, username, password, role, req.params.id], function (err) {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error updating user' });
        }
        res.json({ success: true, changes: this.changes });
    });
    stmt.finalize();
});

// Update an existing business
app.put('/Business/:id', (req, res) => {
  const { businessName, contactType, contactDate, notes, createdAt } = req.body;
    const stmt = db.prepare(`UPDATE Businesses SET
      businessName = ?, contactType = ?, contactDate = ?, notes = ?, createdAt = ?
      WHERE businessID = ?`);
  stmt.run([businessName, contactType, contactDate, notes, createdAt, req.params.id], function (err) {
      if (err) {
          return res.status(500).json({ success: false, message: 'Error updating business' });
      }
      res.json({ success: true, changes: this.changes });
  });
  stmt.finalize();
});

// Delete an user
app.delete('/Users/:id', (req, res) => {
    const stmt = db.prepare('DELETE FROM Users WHERE UserID = ?');
    stmt.run([req.params.id], function (err) {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error deleting entity' });
        }
        res.json({ success: true, changes: this.changes });
    });
    stmt.finalize();
});

// Delete an Business
app.delete('/Businesses/:id', (req, res) => {
  const stmt = db.prepare('DELETE FROM Businesses WHERE BusinessID = ?');
  stmt.run([req.params.id], function (err) {
      if (err) {
          return res.status(500).json({ success: false, message: 'Error deleting Business' });
      }
      res.json({ success: true, changes: this.changes });
  });
  stmt.finalize();
});

// Start the Server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
