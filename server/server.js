const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('publics'));

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

async function findUserByEmail(email) {
  const users = await readUsers();
  return users.find(u => u.email === email);
}


app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, mot de passe et nom requis' });
    }

    const users = await readUsers();
    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
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

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const users = await readUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/events', async (req, res) => {
  try {
    const events = await readEvents();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/events/:id', async (req, res) => {
  try {
    const events = await readEvents();
    const event = events.find(e => e.id === req.params.id);
    if (event) {
      res.json(event);
    } else {
      res.status(404).json({ error: 'Événement non trouvé' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
app.post('/api/events', async (req, res) => {
  try {
    const { title, description, date, time, location, userId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Vous devez être connecté' });
    }

    const events = await readEvents();
    
    const newEvent = {
      id: Date.now().toString(),
      title,
      description,
      date,
      time: time || '09:00',
      location,
      createdBy: userId,
      votes: [], 
      registrations: [], 
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
    const { userId } = req.body;
    const eventId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: 'Vous devez être connecté' });
    }

    const events = await readEvents();
    const eventIndex = events.findIndex(e => e.id === eventId);
    
    if (eventIndex === -1) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }

    const hasVoted = events[eventIndex].votes.some(v => v.userId === userId);
    if (hasVoted) {
      return res.status(400).json({ error: 'Vous avez déjà voté pour cet événement' });
    }

    events[eventIndex].votes.push({ userId });
    await writeEvents(events);

    res.json({
      ...events[eventIndex],
      voteCount: events[eventIndex].votes.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});



app.post('/api/events/:id/register', async (req, res) => {
  try {
    const { userId, email, name } = req.body;
    const eventId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: 'Vous devez être connecté' });
    }

    const events = await readEvents();
    const eventIndex = events.findIndex(e => e.id === eventId);
    
    if (eventIndex === -1) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }

    const isRegistered = events[eventIndex].registrations.some(r => r.userId === userId);
    if (isRegistered) {
      return res.status(400).json({ error: 'Vous êtes déjà inscrit à cet événement' });
    }

    events[eventIndex].registrations.push({ userId, email, name });
    await writeEvents(events);

    res.json({
      ...events[eventIndex],
      registrationCount: events[eventIndex].registrations.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.delete('/api/events/:id/register', async (req, res) => {
  try {
    const { userId } = req.body;
    const eventId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: 'Vous devez être connecté' });
    }

    const events = await readEvents();
    const eventIndex = events.findIndex(e => e.id === eventId);
    
    if (eventIndex === -1) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }

    events[eventIndex].registrations = 
      events[eventIndex].registrations.filter(r => r.userId !== userId);
    await writeEvents(events);

    res.json({
      ...events[eventIndex],
      registrationCount: events[eventIndex].registrations.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});