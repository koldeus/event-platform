const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; 
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../publics')));

const DATA_FILE = path.join(__dirname, 'data', 'events.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

async function readEvents() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeEvents(events) {
  await fs.writeFile(DATA_FILE, JSON.stringify(events, null, 2));
}

async function readUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

// ===== ROUTES D'AUTHENTIFICATION =====

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const users = await readUsers();
    
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Email déjà utilisé' });
    }
    
    const newUser = {
      id: Date.now().toString(),
      email,
      password,
      name,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    await writeUsers(users);
    
    res.status(201).json({ id: newUser.id, email: newUser.email, name: newUser.name });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = await readUsers();
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    
    res.json({ id: user.id, email: user.email, name: user.name });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ===== ROUTES ÉVÉNEMENTS =====

app.get('/api/events', async (req, res) => {
  try {
    const events = await readEvents();
    const eventsWithCounts = events.map(event => ({
      ...event,
      votes: event.votes || 0,
      registrations: event.registrations || [],
      registrationCount: (event.registrations || []).length
    }));
    res.json(eventsWithCounts);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/events/:id', async (req, res) => {
  try {
    const events = await readEvents();
    const event = events.find(e => e.id === req.params.id);
    if (event) {
      res.json({
        ...event,
        votes: event.votes || 0,
        registrations: event.registrations || [],
        registrationCount: (event.registrations || []).length
      });
    } else {
      res.status(404).json({ error: 'Événement non trouvé' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const { title, description, date, location } = req.body;
    const events = await readEvents();
    
    const newEvent = {
      id: Date.now().toString(),
      title,
      description,
      date,
      location,
      votes: 0,
      createdAt: new Date().toISOString()
    };
    
    events.push(newEvent);
    await writeEvents(events);
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/events/:id/vote', async (req, res) => {
  try {
    const events = await readEvents();
    const eventIndex = events.findIndex(e => e.id === req.params.id);
    
    if (eventIndex !== -1) {
      events[eventIndex].votes = (events[eventIndex].votes || 0) + 1;
      await writeEvents(events);
      res.json(events[eventIndex]);
    } else {
      res.status(404).json({ error: 'Événement non trouvé' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/events/:id/register', async (req, res) => {
  try {
    const { userId } = req.body;
    const events = await readEvents();
    const eventIndex = events.findIndex(e => e.id === req.params.id);
    
    if (eventIndex === -1) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }
    
    if (!events[eventIndex].registrations) {
      events[eventIndex].registrations = [];
    }
    
    if (events[eventIndex].registrations.find(r => r.userId === userId)) {
      return res.status(400).json({ error: 'Vous êtes déjà enregistré' });
    }
    
    events[eventIndex].registrations.push({ userId, registeredAt: new Date().toISOString() });
    await writeEvents(events);
    
    res.json({
      ...events[eventIndex],
      registrationCount: events[eventIndex].registrations.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/events/:id/unregister', async (req, res) => {
  try {
    const { userId } = req.body;
    const events = await readEvents();
    const eventIndex = events.findIndex(e => e.id === req.params.id);
    
    if (eventIndex === -1) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }
    
    if (!events[eventIndex].registrations) {
      events[eventIndex].registrations = [];
    }
    
    events[eventIndex].registrations = events[eventIndex].registrations.filter(r => r.userId !== userId);
    await writeEvents(events);
    
    res.json({
      ...events[eventIndex],
      registrationCount: events[eventIndex].registrations.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});