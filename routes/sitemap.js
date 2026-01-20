import express from "express";
import { SitemapStream, streamToPromise } from "sitemap";
import Product from '../models/Product.js'

const simpleRouter = express.Router();

router.get("/sitemap.xml", async (req, res) => {
  try {
    res.header("Content-Type", "application/xml");

    const smStream = new SitemapStream({
      hostname: "https://thevanillashop.lk",
    });

    // 🔹 Static pages
    smStream.write({ url: "/", changefreq: "daily", priority: 1.0 });
    smStream.write({ url: "/shop", changefreq: "daily", priority: 0.9 });
    smStream.write({ url: "/about", changefreq: "monthly", priority: 0.5 });
    smStream.write({ url: "/contact", changefreq: "monthly", priority: 0.5 });
    sitemap.write({ url: "/privacy", changefreq: "monthly", priority: 0.6 });
    sitemap.write({ url: "/terms", changefreq: "monthly", priority: 0.6 });
    sitemap.write({ url: "/refund", changefreq: "monthly", priority: 0.6 });

    // 🔹 Products
    const products = await Product.find({}, "slug updatedAt");
    products.forEach((product) => {
      smStream.write({
        url: `/product/${product.slug}`,
        lastmod: product.updatedAt,
        changefreq: "weekly",
        priority: 0.8,
      });
    });

    smStream.end();

    const sitemap = await streamToPromise(smStream);
    res.send(sitemap.toString());

  } catch (error) {
    console.error("Sitemap Error:", error);
    res.status(500).end();
  }
});

export default simpleRouter;
