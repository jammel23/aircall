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
    const response = await axios.get(
      "https://creator.zoho.com/api/v2.1/shopsolarkits/store-review-management/report/Store_Report",
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          Accept: "application/json"
        }
      }
    );

    const storeData = response.data.data.map(r => {
  const addr = r.Address;
  const parts = [];

  if (addr.address_line_1) parts.push(addr.address_line_1);
  if (addr.address_line_2) parts.push(addr.address_line_2);
  if (addr.city) parts.push(addr.city);
  if (addr.state) parts.push(addr.state);
  if (addr.zip) parts.push(addr.zip);
  if (addr.country) parts.push(addr.country);

  return {
    name: r.Name,
    address: parts.join(', '),
    lat: isFinite(parseFloat(addr.latitude)) ? parseFloat(addr.latitude) : null,
    lng: isFinite(parseFloat(addr.longitude)) ? parseFloat(addr.longitude) : null,
    contact: r.Contact,
    website: r.Website
  };
});


    res.json(storeData);
  } catch (err) {
    console.error("Zoho API error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch Zoho data" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
