// Développé par Keni Mottin et Noah Bouzique

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const DATA_DIR = path.join(__dirname, "data");
const EVENTS_FILE = path.join(DATA_DIR, "events.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");

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

function repairEventData(event) {
  if (!Array.isArray(event.votes)) {
    console.warn(`Réparation des votes pour l'événement ${event.id}`);
    event.votes = [];
  }

  if (!Array.isArray(event.registrations)) {
    console.warn(`Réparation des registrations pour l'événement ${event.id}`);
    event.registrations = [];
  }

  return event;
}

const api = express.Router();

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

api.get("/events", async (req, res) => {
  try {
    const events = await readJSON(EVENTS_FILE);
    res.json(
      events.map((e) => {
        const repaired = repairEventData(e);
        return {
          ...repaired,
          registrationCount: repaired.registrations.length,
        };
      }),
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

    const repaired = repairEventData(event);
    res.json({
      ...repaired,
      registrationCount: repaired.registrations.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

api.post("/events", async (req, res) => {
  try {
    const { title, description, date, time, location, createdBy } = req.body;
    const events = await readJSON(EVENTS_FILE);

    const newEvent = {
      id: Date.now().toString(),
      title,
      description,
      date,
      time: time || "09:00",
      location,
      createdBy,
      votes: [],
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

api.delete("/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const events = await readJSON(EVENTS_FILE);
    const eventIndex = events.findIndex((e) => e.id === id);

    if (eventIndex === -1) {
      return res.status(404).json({ error: "Événement non trouvé" });
    }

    events.splice(eventIndex, 1);
    await writeJSON(EVENTS_FILE, events);

    console.log(`✅ Événement ${id} supprimé avec succès`);
    res.json({ message: "Événement supprimé avec succès" });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

api.post("/events/:id/vote", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId requis" });
    }

    const events = await readJSON(EVENTS_FILE);
    const eventIndex = events.findIndex((e) => e.id === req.params.id);

    if (eventIndex === -1) {
      return res.status(404).json({ error: "Événement non trouvé" });
    }

    const event = repairEventData(events[eventIndex]);

    if (event.votes.some((v) => v.userId === userId)) {
      return res
        .status(400)
        .json({ error: "Vous avez déjà voté pour cet événement" });
    }

    event.votes.push({ userId });
    events[eventIndex] = event;

    console.log(
      `✅ Vote ajouté pour l'événement ${event.id} par l'utilisateur ${userId}`,
    );
    console.log(`   Votes actuels:`, JSON.stringify(event.votes));

    await writeJSON(EVENTS_FILE, events);

    res.json({
      ...event,
      registrationCount: event.registrations.length,
    });
  } catch (err) {
    console.error("❌ Erreur lors du vote:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

api.post("/events/:id/register", async (req, res) => {
  try {
    const { userId, name, email } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId requis" });
    }

    const events = await readJSON(EVENTS_FILE);
    const eventIndex = events.findIndex((e) => e.id === req.params.id);

    if (eventIndex === -1) {
      return res.status(404).json({ error: "Événement non trouvé" });
    }

    const event = repairEventData(events[eventIndex]);

    if (event.registrations.some((r) => r.userId === userId)) {
      return res.status(400).json({ error: "Déjà inscrit" });
    }

    event.registrations.push({
      userId,
      name,
      email,
      registeredAt: new Date().toISOString(),
    });

    events[eventIndex] = event;
    await writeJSON(EVENTS_FILE, events);

    console.log(
      `✅ Inscription ajoutée pour l'événement ${event.id} par ${name || email || userId}`,
    );

    res.json({ ...event, registrationCount: event.registrations.length });
  } catch (err) {
    console.error("❌ Erreur lors de l'inscription:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

api.post("/events/:id/unregister", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId requis" });
    }

    const events = await readJSON(EVENTS_FILE);
    const eventIndex = events.findIndex((e) => e.id === req.params.id);

    if (eventIndex === -1) {
      return res.status(404).json({ error: "Événement non trouvé" });
    }

    const event = repairEventData(events[eventIndex]);

    const originalLength = event.registrations.length;
    event.registrations = event.registrations.filter(
      (r) => r.userId !== userId,
    );

    if (event.registrations.length === originalLength) {
      return res
        .status(400)
        .json({ error: "Vous n'êtes pas inscrit à cet événement" });
    }

    events[eventIndex] = event;
    await writeJSON(EVENTS_FILE, events);

    console.log(
      `✅ Désinscription réussie pour l'événement ${event.id} par l'utilisateur ${userId}`,
    );
    console.log(
      `   Inscriptions avant: ${originalLength}, après: ${event.registrations.length}`,
    );

    res.json({ ...event, registrationCount: event.registrations.length });
  } catch (err) {
    console.error("❌ Erreur lors de la désinscription:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

api.post("/admin/repair", async (req, res) => {
  try {
    const events = await readJSON(EVENTS_FILE);
    const repairedEvents = events.map(repairEventData);
    await writeJSON(EVENTS_FILE, repairedEvents);

    res.json({
      message: "Données réparées avec succès",
      count: repairedEvents.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

api.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.use("/api", api);

ensureFiles().then(() => {
  const PORT = process.env.PORT || 3000;
  const IP = process.env.IP || "::";

  const server = app.listen(PORT, IP, () => {
    console.log(`🚀 SERVEUR ACTIF sur [${IP}]:${PORT}`);
    console.log(`\n📍 Routes disponibles:`);
    console.log(`   POST   /api/auth/signup`);
    console.log(`   POST   /api/auth/login`);
    console.log(`   GET    /api/events`);
    console.log(`   POST   /api/events`);
    console.log(`   GET    /api/events/:id`);
    console.log(`   DELETE /api/events/:id`);
    console.log(`   POST   /api/events/:id/vote`);
    console.log(`   POST   /api/events/:id/register`);
    console.log(`   POST   /api/events/:id/unregister ✅`);
    console.log(`   POST   /api/admin/repair`);
    console.log(`   GET    /api/health\n`);
  });

  server.on("error", (err) => {
    console.error("ERREUR SERVEUR :", err.message);
    if (IP !== "0.0.0.0") {
      app.listen(PORT, "0.0.0.0");
    }
  });
});
