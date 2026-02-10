const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* =======================
   MIDDLEWARES
======================= */
app.use(cors());
app.use(bodyParser.json());

/* =======================
   PATHS DATA
======================= */
const DATA_DIR = path.join(__dirname, "data");
const EVENTS_FILE = path.join(DATA_DIR, "events.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");

/* =======================
   UTILS
======================= */
async function ensureFiles() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });

    try {
      await fs.access(EVENTS_FILE);
    } catch {
      await fs.writeFile(EVENTS_FILE, "[]");
    }

    try {
      await fs.access(USERS_FILE);
    } catch {
      await fs.writeFile(USERS_FILE, "[]");
    }
  } catch (err) {
    console.error("Erreur initialisation fichiers:", err);
    process.exit(1);
  }
}

async function readJSON(file) {
  const data = await fs.readFile(file, "utf8");
  return JSON.parse(data || "[]");
}

async function writeJSON(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

/* =======================
   ROUTER API
======================= */
const api = express.Router();

/* ---- AUTH ---- */
api.post("/auth/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const users = await readJSON(USERS_FILE);

    if (users.find((u) => u.email === email)) {
      return res.status(400).json({ error: "Email déjà utilisé" });
    }

    const newUser = {
      id: Date.now().toString(),
      email,
      password,
      name,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    await writeJSON(USERS_FILE, users);

    res.status(201).json({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

api.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = await readJSON(USERS_FILE);

    const user = users.find(
      (u) => u.email === email && u.password === password,
    );

    if (!user) {
      return res.status(401).json({ error: "Identifiants invalides" });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* ---- EVENTS ---- */
api.get("/events", async (req, res) => {
  try {
    const events = await readJSON(EVENTS_FILE);
    res.json(
      events.map((e) => ({
        ...e,
        votes: e.votes || 0,
        registrations: e.registrations || [],
        registrationCount: (e.registrations || []).length,
      })),
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

api.get("/events/:id", async (req, res) => {
  try {
    const events = await readJSON(EVENTS_FILE);
    const event = events.find((e) => e.id === req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Événement non trouvé" });
    }

    res.json({
      ...event,
      votes: event.votes || 0,
      registrations: event.registrations || [],
      registrationCount: (event.registrations || []).length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

api.post("/events", async (req, res) => {
  try {
    const { title, description, date, time, location } = req.body;
    const events = await readJSON(EVENTS_FILE);

    const newEvent = {
      id: Date.now().toString(),
      title,
      description,
      date,
      time: time || "09:00",
      location,
      votes: 0,
      registrations: [],
      createdAt: new Date().toISOString(),
    };

    events.push(newEvent);
    await writeJSON(EVENTS_FILE, events);

    res.status(201).json(newEvent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

api.post("/events/:id/vote", async (req, res) => {
  try {
    const events = await readJSON(EVENTS_FILE);
    const event = events.find((e) => e.id === req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Événement non trouvé" });
    }

    event.votes = (event.votes || 0) + 1;
    await writeJSON(EVENTS_FILE, events);

    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

api.post("/events/:id/register", async (req, res) => {
  try {
    const { userId } = req.body;
    const events = await readJSON(EVENTS_FILE);
    const event = events.find((e) => e.id === req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Événement non trouvé" });
    }

    event.registrations ||= [];

    if (event.registrations.find((r) => r.userId === userId)) {
      return res.status(400).json({ error: "Déjà inscrit" });
    }

    event.registrations.push({
      userId,
      registeredAt: new Date().toISOString(),
    });

    await writeJSON(EVENTS_FILE, events);
    res.json({ ...event, registrationCount: event.registrations.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

api.post("/events/:id/unregister", async (req, res) => {
  try {
    const { userId } = req.body;
    const events = await readJSON(EVENTS_FILE);
    const event = events.find((e) => e.id === req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Événement non trouvé" });
    }

    event.registrations = (event.registrations || []).filter(
      (r) => r.userId !== userId,
    );

    await writeJSON(EVENTS_FILE, events);
    res.json({ ...event, registrationCount: event.registrations.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* ---- HEALTH ---- */
api.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

/* =======================
   MOUNT ROUTER
======================= */
app.use("/api", api);

/* =======================
   START SERVER
======================= */
ensureFiles().then(() => {
  const PORT = process.env.PORT || 3000;
  const IP = process.env.IP || "::"; 

  const server = app.listen(PORT, IP, () => {
    console.log(`🚀 SERVEUR ACTIF sur [${IP}]:${PORT}`);
  });

  server.on('error', (err) => {
    console.error('ERREUR SERVEUR :', err.message);
    if (IP !== "0.0.0.0") {
        app.listen(PORT, "0.0.0.0");
    }
  });
});
