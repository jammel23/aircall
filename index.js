require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();

app.use(cors()); // Enable CORS

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
        grant_type: "refresh_token",
      },
    }
  );
  accessToken = res.data.access_token;
  return accessToken;
}

app.get("/api/stores", async (req, res) => {
  try {
    await getAccessToken();
    const r = await axios.get(
      "https://creator.zoho.com/api/v2.1/shopsolarkits/store-review-management/report/Store_Report",
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          Accept: "application/json",
        },
      }
    );
    const data = r.data.data;
    const stores = data.map((r) => {
      const addr = r.Address;
      const fullAddress = [
        addr.address_line_1,
        addr.city,
        addr.state,
        addr.zip,
        addr.country,
      ]
        .filter(Boolean)
        .join(", ");

      return {
        name: r.Name,
        address: fullAddress,
        lat: parseFloat(addr.latitude) || null,
        lng: parseFloat(addr.longitude) || null,
        contact: r.Contact || "",
        website: r.Website || "",
      };
    });
    res.json(stores);
  } catch (e) {
    console.error("Zoho API error:", e.response?.data || e.message);
    res.status(500).json({ error: "Failed fetching stores" });
  }
});

app.get("/api/reviews", async (req, res) => {
  try {
    const store = req.query.store; // expects store name exactly
    await getAccessToken();
    const r = await axios.get(
      "https://creator.zoho.com/api/v2.1/shopsolarkits/store-review-management/report/Review_Report",
      {
        params: { criteria: `(Store.first_name == "${store}")` },
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          Accept: "application/json",
        },
      }
    );

    const reviews = r.data.data.map((r) => ({
      customer: r.Customer,
      rating: r.Rating,
      review: r.Review,
      date: r.Rating_Date,
      image: Array.isArray(r.Image) && r.Image.length
        ? r.Image[0].download_url
        : null,
    }));

    res.json(reviews);
  } catch (e) {
    console.error("Zoho API error on reviews:", e.response?.data || e.message);
    res.status(500).json({ error: "Failed fetching reviews" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
