require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");

const app = express();
app.use(cors());

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

let accessToken = "";

// 🔐 Get Zoho OAuth access token
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

// 🧰 Multer middleware
const upload = multer({ storage: multer.memoryStorage() });

/**
 * 📥 POST /api/reviews — submits a review to Zoho Creator
 */
app.post("/api/reviews", upload.single("Image"), async (req, res) => {
  try {
    await getAccessToken();

    const { Store, Customer_name, Review, Rating } = req.body;
    const file = req.file;

    if (!Store || !Customer_name || !Review || !Rating) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ Payload formatted for Zoho Creator field types
    const reviewData = {
      Store: { ID: Store },
      Customer: { first_name: Customer_name },
      Review,
      Rating: parseInt(Rating, 10)
    };

    const formData = new FormData();
    formData.append("data", JSON.stringify(reviewData));

    if (file) {
      formData.append("Image", file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype
      });
    }

    const response = await axios.post(
      "https://creator.zoho.com/api/v2.1/shopsolarkits/store-review-management/form/Review",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Zoho-oauthtoken ${accessToken}`
        }
      }
    );

    res.status(201).json({ message: "Review submitted successfully", response: response.data });

  } catch (err) {
    console.error("Upload error:", err.response?.data || err.message);
    res.status(500).json({
      error: "Upload failed",
      details: err.response?.data || err.message
    });
  }
});

/**
 * 📤 GET /api/stores — returns store + review data
 */
app.get("/api/stores", async (req, res) => {
  try {
    await getAccessToken();

    const [storeResponse, reviewResponse] = await Promise.all([
      axios.get("https://creator.zoho.com/api/v2.1/shopsolarkits/store-review-management/report/Store_Report", {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          Accept: "application/json"
        }
      }),
      axios.get("https://creator.zoho.com/api/v2.1/shopsolarkits/store-review-management/report/Review_Report", {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          Accept: "application/json"
        }
      })
    ]);

    const formattedStores = storeResponse.data.data.map(store => ({
      Store: store.Name?.zc_display_value || "",
      ID: store.ID,
      first_name: store.Name?.first_name || "",
      Email: store.Email || "",
      Address: store.Address?.zc_display_value || "",
      latitude: store.Address?.latitude || "",
      longitude: store.Address?.longitude || "",
      Contact: store.Contact || ""
    }));

    const formattedReviews = reviewResponse.data.data.map(review => ({
      Store: review.Store?.zc_display_value || "",
      ID: review.ID,
      Customer_first_name: review.Customer?.first_name || "",
      Review: review.Review || "",
      Image: review.Image || "",
      Rating: review.Rating || ""
    }));

    res.json({
      storeReport: formattedStores,
      reviewReport: formattedReviews
    });

  } catch (err) {
    console.error("Zoho API error:", err.response?.data || err.message);
    res.status(500).json({
      error: "Failed to fetch Zoho data",
      details: err.response?.data || err.message
    });
  }
});

// 🚀 Start the server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server listening on port ${PORT}`));
