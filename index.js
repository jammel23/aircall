const express = require("express");
const axios = require("axios");
const app = express();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
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
}

app.get("/api/stores", async (req, res) => {
  try {
    if (!accessToken) await getAccessToken();

    const response = await axios.get("https://creator.zoho.com/api/v2.1/shopsolarkits/store-review-management/report/Store_Report", {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`
      }
    });

    const storeData = response.data.data.map(record => ({
      name: record.Store_Name,
      address: record.Address,
      lat: parseFloat(record.Latitude),
      lng: parseFloat(record.Longitude),
      contact: record.Contact,
      email: record.Email,
      website: record.Website
    }));

    res.json(storeData);
  } catch (err) {
    if (err.response && err.response.status === 401) {
      await getAccessToken();
      return res.redirect("/api/stores");
    }
    res.status(500).json({ error: "Failed to fetch Zoho data" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
