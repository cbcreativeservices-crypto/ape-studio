/* ============================================================
 *  APP STORE LINKS — fill in when the listings go live.
 *  ------------------------------------------------------------
 *  1. Paste the two store URLs below.
 *  2. Set APP_LINKS_LIVE = true.
 *  3. (Optional) Drop a QR image at web/public/app-qr.png that
 *     encodes  https://www.proaudiotrainingacademy.com/get
 *     and set APP_QR_READY = true.
 *
 *  The QR should point at /get — that page auto-sends iPhone
 *  users to the App Store and Android users to Google Play, so
 *  one QR works for both and never has to change.
 * ============================================================ */

export const APP_STORE_URL = "https://apps.apple.com/app/id6813607582"; // ascAppId in eas.json
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.cbcreativeservices.apestudio";

// Flip to true once BOTH urls above are filled in.
export const APP_LINKS_LIVE = true;

// QR image lives at web/public/app-qr.png; flip to true once it exists.
export const APP_QR_SRC = "/app-qr.png";
export const APP_QR_READY = false;
