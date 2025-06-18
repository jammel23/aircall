require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();

app.use(cors());

const { CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN } = process.env;
let accessToken = "";

async function getAccessToken() {
  const res = await axios.post("https://accounts.zoho.com/oauth/v2/token", null, {
    params: {
      refresh_token: REFRESH_TOKEN,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "refresh_token"
    }
  });
  accessToken = res.data.access_token;
  return accessToken;
}

app.get("/api/stores", async (req, res) => {
  try {
    await getAccessToken();
    const ZohoRes = await axios.get(
      "https://creator.zoho.com/api/v2.1/shopsolarkits/store-review-management/report/Store_Report",
      { headers: { Authorization: `Zoho-oauthtoken ${accessToken}` } }
    );
    const storeData = ZohoRes.data.data.map(r => ({
      name: r.Name,
      address: r.Address?.display_value,
      lat: Number(r.Address?.latitude) || null,
      lng: Number(r.Address?.longitude) || null,
      contact: r.Contact,
      website: r.Website
    }));
    res.json(storeData);
  } catch (err) {
    console.error("Zoho API error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch Zoho data" });
  }
});

app.get("/api/reviews", async (req, res) => {
  try {
    const storeName = req.query.store_name;
    await getAccessToken();
    const ZohoRes = await axios.get(
      "https://creator.zoho.com/api/v2.1/shopsolarkits/store-review-management/report/Review_Report",
      {
        params: { criteria: `(Store.first_name=="${storeName}")` },
        headers: { Authorization: `Zoho-oauthtoken ${accessToken}` }
      }
    );
    const reviews = ZohoRes.data.data.map(r => ({
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
