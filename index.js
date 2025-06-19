// index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();

app.use(cors()); // 💡 Enable CORS for fetch from frontend

const {
  CLIENT_ID,
  CLIENT_SECRET,
  REFRESH_TOKEN,
  PORT = 10000
} = process.env;

let accessToken = "";

async function refreshToken() {
  const resp = await axios.post(
    "https://accounts.zoho.com/oauth/v2/token",
    null,
    {
      params: {
        refresh_token: REFRESH_TOKEN,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "refresh_token"
      }
    }
  );
  accessToken = resp.data.access_token;
}

// 🔎 GET /api/stores — returns stores with full address components
app.get("/api/stores", async (req, res) => {
  try {
    await refreshToken();

    const resp = await axios.get(
      "https://creator.zoho.com/api/v2.1/shopsolarkits/store-review-management/report/Store_Report",
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          Accept: "application/json"
        }
      }
    );

    const stores = resp.data.data.map(r => ({
      id: r.id,
      name: r.Name,
      address: r.Address.display_value,
      addressComponents: {
        line1: r.Address.address_line_1,
        line2: r.Address.address_line_2,
        city: r.Address.city,
        state: r.Address.state,
        postalCode: r.Address.postal_code,
        country: r.Address.country
      },
      coordinates: {
        lat: parseFloat(r.Address.latitude),
        lng: parseFloat(r.Address.longitude)
      },
      contact: r.Contact,
      email: r.Email,
      website: r.Website
    }));

    res.json(stores);
  } catch (err) {
    console.error("Zoho Stores API error:", err.response?.data || err);
    res.status(500).json({ error: "Failed to fetch store data" });
  }
});

// 📝 GET /api/reviews?store_name=SomeStore — returns reviews with image (if any)
app.get("/api/reviews", async (req, res) => {
  const { store_name } = req.query;
  if (!store_name) {
    return res.status(400).json({ error: "Missing store_name query parameter" });
  }

  try {
    await refreshToken();

    const resp = await axios.get(
      "https://creator.zoho.com/api/v2.1/shopsolarkits/store-review-management/report/Review_Report",
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          Accept: "application/json"
        },
        params: {
          criteria: `(Store.first_name == "${store_name}")`
        }
      }
    );

    const reviews = resp.data.data.map(r => ({
      id: r.id,
      customer: r.Customer,
      rating: r.Rating,
      review: r.Review,
      image: r.Image?.[0]?.download_url || null,
      date: r.Rating_Date
    }));

    res.json(reviews);
  } catch (err) {
    console.error("Zoho Reviews API error:", err.response?.data || err);
    res.status(500).json({ error: "Failed to fetch review data" });
  }
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
