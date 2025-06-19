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

    // --- Fetch Store Report ---
    const storeResponse = await axios.get(
      "https://creator.zoho.com/api/v2.1/shopsolarkits/store-review-management/report/Store_Report",
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          Accept: "application/json"
        }
      }
    );

    const stores = storeResponse.data.data.map(item => {
      const name = item.Name || {};
      const address = item.Address || {};

      return {
        first_name: name.first_name?.trim() || "",
        zc_display_value: name.zc_display_value?.trim() || "",
        latitude: parseFloat(address.latitude) || null,
        longitude: parseFloat(address.longitude) || null,
        contact: item.Contact || "",
        email: item.Email || ""
      };
    });

    // --- Fetch Review Report ---
    const reviewResponse = await axios.get(
      "https://creator.zoho.com/api/v2.1/shopsolarkits/store-review-management/report/Review_Report",
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          Accept: "application/json"
        }
      }
    );

    const reviews = reviewResponse.data.data.map(item => {
      const customer = item.Customer || {};

      return {
        first_name: customer.first_name?.trim() || "",
        review: item.Review || "",
        image: item.Image || ""
      };
    });

    // --- Return Combined Response ---
    res.json({
      stores,
      reviews
    });

  } catch (err) {
    console.error("Zoho API error:", err.response?.data || err.message);
    res.status(500).json({
      error: "Failed to fetch Zoho data",
      details: err.response?.data || err.message
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
