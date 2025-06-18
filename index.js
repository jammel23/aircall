require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();

app.use(cors());

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
let accessToken = "";

async function getAccessToken() {
  const res = await axios.post(
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
  accessToken = res.data.access_token;
  return accessToken;
}

// Get store locations
app.get("/api/stores", async (req, res) => {
  try {
    await getAccessToken();
    const resp = await axios.get(
      "https://creator.zoho.com/api/v2.1/shopsolarkits/store-review-management/report/Store_Report",
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          Accept: "application/json"
        }
      }
    );

    const storeData = resp.data.data.map(r => ({
      name: r.Name?.first_name || r.Name?.zc_display_value || "",
      address: r.Address?.display_value || "",
      lat: isFinite(parseFloat(r.Address?.latitude))
        ? parseFloat(r.Address.latitude)
        : null,
      lng: isFinite(parseFloat(r.Address?.longitude))
        ? parseFloat(r.Address.longitude)
        : null,
      contact: r.Contact || "",
      website: r.Website || ""
    }));

    res.json(storeData);
  } catch (err) {
    console.error("Zoho API error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch Zoho data" });
  }
});

// Get reviews for a specific store
app.get("/api/stores", async (req, res) => {
  // ...exists

  const storeData = response.data.data.map(r => ({
    name: r.Name,  // adjust to the exact field name in Zoho Creator
    address: r.Address.display_value || r.Address.address_line_1,
    lat: Number(r.Address.latitude),
    lng: Number(r.Address.longitude),
    contact: r.Contact,
    website: r.Website
  }));
  res.json(storeData);
});

app.get("/api/reviews", async (req, res) => {
  const { store_name } = req.query;
  try {
    await getAccessToken();
    const resp = await axios.get(
      "https://creator.zoho.com/api/v2.1/shopsolarkits/store-review-management/report/Review_Report",
      {
        params: {
          criteria: `(Store.first_name == "${store_name}")`
        },
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          Accept: "application/json"  // 🟢 Important: accept JSON here
        }
      }
    );

    const reviews = resp.data.data.map(r => ({
      customer: r.Customer,
      rating: r.Rating,
      review: r.Review,
      image: r.Image?.[0]?.download_url || null,
      date: r.Rating_Date
    }));
    res.json(reviews);

  } catch (e) {
    console.error("Error fetching reviews:", e.response?.data || e.message);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});


const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
