// pages/api/meetings-from-ghl.js

export default async function handler(req, res) {
  const locationId = process.env.NEXT_PUBLIC_GHL_LOCATION_ID;
  const privateKey = process.env.GHL_PRIVATE_API_KEY;
  const baseUrl = process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com';

  if (!locationId || !privateKey) {
    return res.status(500).json({
      error: 'Missing GHL env vars',
      details: {
        NEXT_PUBLIC_GHL_LOCATION_ID: !!locationId,
        GHL_PRIVATE_API_KEY: !!privateKey,
      },
    });
  }

  try {
    // 👉 This is the SAME URL that works in Postman
    const url = `${baseUrl}/calendars/events/appointments?locationId=${encodeURIComponent(
      locationId
    )}`;

    const ghlRes = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${privateKey}`,
        Version: '2021-07-28',
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const rawBody = await ghlRes.text();
    let parsed;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      parsed = { raw: rawBody };
    }

    // For now, just bubble back whatever GHL returns so we can inspect it
    return res.status(200).json({
      ok: ghlRes.ok,
      status: ghlRes.status,
      statusText: ghlRes.statusText,
      url,
      parsed,
    });
  } catch (err) {
    console.error('Error calling GHL:', err);
    return res.status(500).json({
      error: 'Exception calling GHL',
      message: err.message,
    });
  }
}