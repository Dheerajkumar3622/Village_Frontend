import { Location } from "../backend/models.js";

/**
 * Search villages by name (Bihar geo data)
 * Query param: q
 */
export const searchVillages = async (req, res) => {
  try {
    const q = req.query.q?.trim();

    if (!q || q.length < 2) {
      return res.json([]);
    }

    const villages = await Location.find(
      {
        $or: [
          { name: { $regex: q, $options: "i" } },
          { "properties.NAME": { $regex: q, $options: "i" } }
        ]
      },
      {
        name: 1,
        district: 1,
        "properties.SUB_DIST": 1,
        "properties.DISTRICT": 1
      }
    )
      .limit(20)
      .lean();

    res.json(
      villages.map(v => ({
        name: v.name || v.properties?.NAME,
        subDistrict: v.properties?.SUB_DIST || "",
        district: v.properties?.DISTRICT || ""
      }))
    );
  } catch (err) {
    console.error("Village search error:", err);
    res.status(500).json({ message: "Village search failed" });
  }
};
