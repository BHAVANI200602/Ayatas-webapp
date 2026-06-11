import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseUrl !== "MY_SUPABASE_URL" && 
  supabaseAnonKey && 
  supabaseAnonKey !== "MY_SUPABASE_ANON_KEY";

const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

const LOCAL_DB_PATH = path.join(process.cwd(), "profiles_db.json");

function getLocalProfiles() {
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    return {};
  }
  try {
    const data = fs.readFileSync(LOCAL_DB_PATH, "utf8");
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

function saveLocalProfile(email, data) {
  const db = getLocalProfiles();
  db[email.toLowerCase()] = { ...data, updatedAt: new Date().toISOString() };
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

app.get("/api/config", (req, res) => {
  res.json({
    useLocalOnly: !isSupabaseConfigured,
    firebase: {
      apiKey: process.env.FIREBASE_API_KEY || "AIzaSy_demo_key",
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
      projectId: process.env.FIREBASE_PROJECT_ID || "demo-project",
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "demo.appspot.com",
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
      appId: process.env.FIREBASE_APP_ID || "1:123:web:123"
    },
    supabase: {
      url: supabaseUrl || "http://local-demo-url"
    }
  });
});

app.post("/api/profile", async (req, res) => {
  const profileData = req.body;
  if (!profileData || !profileData.email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const emailKey = profileData.email.toLowerCase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .upsert({
          id: profileData.id || emailKey,
          email: emailKey,
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          mobile_number: profileData.mobileNumber,
          country_code: profileData.countryCode,
          country: profileData.country,
          business_name: profileData.businessName,
          website: profileData.website,
          categories: profileData.categories,
          primary_category: profileData.primaryCategory,
          account_type: profileData.accountType,
          service_location: profileData.serviceLocation,
          address: profileData.address,
          marketing_source: profileData.marketingSource
        });

      if (error) {
        saveLocalProfile(emailKey, profileData);
        return res.json({ 
          success: true, 
          source: "local (supabase tables not initialized or restricted)",
          data: profileData 
        });
      }

      return res.json({ success: true, source: "supabase", data });
    } catch (err) {
      saveLocalProfile(emailKey, profileData);
      return res.json({ success: true, source: "local", data: profileData });
    }
  } else {
    saveLocalProfile(emailKey, profileData);
    return res.json({ success: true, source: "local", data: profileData });
  }
});

app.get("/api/profile/:email", async (req, res) => {
  const email = req.params.email;
  if (!email) {
    return res.status(400).json({ error: "Email parameter is required" });
  }

  const emailKey = email.toLowerCase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", emailKey)
        .single();

      if (error || !data) {
        const local = getLocalProfiles();
        if (local[emailKey]) {
          return res.json({ source: "local", data: local[emailKey] });
        }
        return res.status(404).json({ error: "Profile not found" });
      }

      return res.json({
        source: "supabase",
        data: {
          id: data.id,
          email: data.email,
          firstName: data.first_name,
          lastName: data.last_name,
          mobileNumber: data.mobile_number,
          countryCode: data.country_code,
          country: data.country,
          businessName: data.business_name,
          website: data.website,
          categories: data.categories,
          primaryCategory: data.primary_category,
          accountType: data.account_type,
          serviceLocation: data.service_location,
          address: data.address,
          marketingSource: data.marketing_source,
          createdAt: data.created_at
        }
      });
    } catch (err) {
      const local = getLocalProfiles();
      if (local[emailKey]) {
        return res.json({ source: "local", data: local[emailKey] });
      }
      return res.status(404).json({ error: "Profile not found" });
    }
  } else {
    const local = getLocalProfiles();
    if (local[emailKey]) {
      return res.json({ source: "local", data: local[emailKey] });
    }
    return res.status(404).json({ error: "Profile not found" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on address 0.0.0.0:${PORT}`);
  });
}

startServer();
