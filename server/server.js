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

app.get('/events', async (req, res) => {
  try {
    const events = await readEvents();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/events/:id', async (req, res) => {
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

app.post('/events', async (req, res) => {
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

app.post('/events/:id/vote', async (req, res) => {
  try {
    const events = await readEvents();
    const eventIndex = events.findIndex(e => e.id === req.params.id);
    
    if (eventIndex !== -1) {
      events[eventIndex].votes += 1;
      await writeEvents(events);
      res.json(events[eventIndex]);
    } else {
      res.status(404).json({ error: 'Événement non trouvé' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});