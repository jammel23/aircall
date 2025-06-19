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

// Get Zoho OAuth token
async function getAccessToken() {
  try {
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
        timeout: 5000 // Prevent hanging requests
      }
    );
    accessToken = res.data.access_token;
    return accessToken;
  } catch (error) {
    console.error("Failed to refresh access token:", error.message);
    throw new Error("Failed to authenticate with Zoho");
  }
}

// Fetch stores
app.get("/api/stores", async (req, res) => {
  try {
    await getAccessToken();
    const response = await axios.get(
      "https://creator.zoho.com/api/v2.1/shopsolarkits/store-review-management/report/Store_Report",
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          Accept: "application/json",
        },
        timeout: 10000 // 10-second timeout
      }
    );

    if (!response.data || !Array.isArray(response.data.data)) {
      throw new Error("Invalid data format from Zoho");
    }

    const stores = response.data.data.map((store) => {
      const addr = store.Address || {};
      const addressParts = [
        addr.display_value || addr.address_line_1,
        addr.city,
        addr.state,
        addr.zip,
        addr.country
      ].filter(Boolean);

      return {
        id: store.ID || store.id || null,
        name: store.Name || "Unnamed Store",
        address: addressParts.join(", "),
        addressComponents: {
          line1: addr.address_line_1,
          line2: addr.address_line_2,
          city: addr.city,
          state: addr.state,
          zip: addr.zip,
          country: addr.country,
          displayValue: addr.display_value
        },
        coordinates: {
          lat: parseFloat(addr.latitude) || null,
          lng: parseFloat(addr.longitude) || null
        },
        contact: store.Contact || "",
        email: store.Email || "",
        website: store.Website || "",
      };
    });

    res.json(stores);
  } catch (error) {
    console.error("Zoho API error:", error.response?.data || error.message);
    res.status(500).json({ 
      error: "Failed to fetch stores",
      details: error.response?.data || error.message 
    });
  }
});

// Fetch reviews
app.get("/api/reviews", async (req, res) => {
  const { store_name } = req.query;
  if (!store_name) {
    return res.status(400).json({ error: "Missing store_name query parameter" });
  }

  try {
    await getAccessToken();

    const response = await axios.get(
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

    const reviews = response.data.data.map(r => ({
      customer: r.Customer || "Anonymous",
      rating: r.Rating || null,
      review: r.Review || "",
      image: r.Image?.[0]?.download_url || null,
      date: r.Rating_Date || null
    }));

    res.json(reviews);
  } catch (err) {
    console.error("Zoho Reviews API error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch review data" });
  }
});
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err.stack);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});