const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const {
  FaHeart, FaGift, FaUsers, FaLock, FaEnvelopeOpenText, FaCheckCircle,
  FaPiggyBank, FaShareAlt, FaWallet, FaListUl, FaRing, FaGlobeAfrica,
  FaExclamationTriangle, FaArrowRight, FaStar, FaHandHoldingHeart,
  FaChartLine, FaRoute
} = require("react-icons/fa");

// ---- Palette: Berry & Cream (matches landing page) ----
const BERRY   = "6D2E46";  // deep berry
const ROSE    = "C8688A";  // rose
const ROSEDP  = "A84D70";  // deep rose
const GOLD    = "D9A86C";  // warm gold
const LGOLD   = "EBCFA8";  // lighter gold for small text on dark
const CREAM   = "FBF6F1";  // cream bg
const SOFT    = "F3E7DF";  // soft blush
const INK     = "2A222F";  // near-black plum
const MUTED   = "6F6470";  // muted mauve
const WHITE   = "FFFFFF";

const HEAD = "Georgia";
const BODY = "Calibri";

async function iconPng(IconComponent, color, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

const mkShadow = () => ({ type: "outer", color: "6D2E46", blur: 9, offset: 3, angle: 135, opacity: 0.18 });

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
  pres.author = "Agamos";
  pres.title = "Agamos — Wedding Gifting Platform";

  const W = 13.3, H = 7.5;

  // Pre-render icons
  const ic = {
    heartW:   await iconPng(FaHeart, "#FFFFFF"),
    ring:     await iconPng(FaRing, "#FFFFFF"),
    warn:     await iconPng(FaExclamationTriangle, "#A84D70"),
    gift:     await iconPng(FaGift, "#A84D70"),
    piggy:    await iconPng(FaPiggyBank, "#A84D70"),
    users:    await iconPng(FaUsers, "#A84D70"),
    envelope: await iconPng(FaEnvelopeOpenText, "#A84D70"),
    lock:     await iconPng(FaLock, "#A84D70"),
    check:    await iconPng(FaCheckCircle, "#A84D70"),
    list:     await iconPng(FaListUl, "#FFFFFF"),
    share:    await iconPng(FaShareAlt, "#FFFFFF"),
    wallet:   await iconPng(FaWallet, "#FFFFFF"),
    globe:    await iconPng(FaGlobeAfrica, "#D9A86C"),
    star:     await iconPng(FaStar, "#D9A86C"),
    hand:     await iconPng(FaHandHoldingHeart, "#FFFFFF"),
    chart:    await iconPng(FaChartLine, "#D9A86C"),
    route:    await iconPng(FaRoute, "#FFFFFF"),
    arrow:    await iconPng(FaArrowRight, "#C8688A"),
    checkW:   await iconPng(FaCheckCircle, "#FFFFFF"),
  };

  // ============ SLIDE 1 — TITLE ============
  let s = pres.addSlide();
  s.background = { color: BERRY };
  // decorative blush circles
  s.addShape(pres.shapes.OVAL, { x: 10.3, y: -1.6, w: 4.6, h: 4.6, fill: { color: ROSEDP, transparency: 55 } });
  s.addShape(pres.shapes.OVAL, { x: 11.6, y: 4.4, w: 3.4, h: 3.4, fill: { color: GOLD, transparency: 70 } });
  s.addImage({ data: ic.ring, x: 0.9, y: 1.35, w: 0.62, h: 0.62 });
  s.addText("AGAMOS", { x: 1.65, y: 1.32, w: 6, h: 0.7, fontFace: HEAD, fontSize: 26, bold: true, color: WHITE, charSpacing: 6, margin: 0 });
  s.addText("Give what they truly wish for.", {
    x: 0.9, y: 2.5, w: 9.6, h: 1.8, fontFace: HEAD, fontSize: 50, bold: true, color: WHITE, italic: true, margin: 0
  });
  s.addText("A wedding gifting platform where couples build one shared wish list — and friends & well-wishers fund or fully buy each gift.", {
    x: 0.95, y: 4.45, w: 8.6, h: 1.2, fontFace: BODY, fontSize: 18, color: "F3E7DF", margin: 0, lineSpacingMultiple: 1.15
  });
  s.addText("Product & Concept Brief  ·  June 2026", {
    x: 0.95, y: 6.55, w: 8, h: 0.4, fontFace: BODY, fontSize: 13, color: LGOLD, charSpacing: 2, margin: 0
  });

  // ============ SLIDE 2 — THE PROBLEM ============
  s = pres.addSlide();
  s.background = { color: CREAM };
  s.addText("The problem with wedding gifting today", {
    x: 0.9, y: 0.6, w: 11.5, h: 0.8, fontFace: HEAD, fontSize: 32, bold: true, color: INK, margin: 0
  });
  s.addText("Couples receive the wrong gifts. Guests struggle to give meaningfully.", {
    x: 0.9, y: 1.45, w: 11.5, h: 0.5, fontFace: BODY, fontSize: 16, color: MUTED, margin: 0
  });

  const problems = [
    ["Duplicates & returns", "Couples end up with three blenders and nothing they actually need."],
    ["Awkward cash gifts", "Giving money feels impersonal, untracked, and hard to do well."],
    ["Retailer lock-in", "Traditional registries tie you to one store and physical products only."],
    ["Distance is hard", "Guests abroad or unable to attend have no easy, secure way to give."],
  ];
  let px = 0.9, pw = 5.55, ph = 1.85, gap = 0.35;
  problems.forEach((p, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = px + col * (pw + gap), y = 2.25 + row * (ph + gap);
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: pw, h: ph, fill: { color: WHITE }, line: { color: SOFT, width: 1 }, shadow: mkShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 0.09, h: ph, fill: { color: ROSE } });
    s.addImage({ data: ic.warn, x: x + 0.35, y: y + 0.32, w: 0.5, h: 0.5 });
    s.addText(p[0], { x: x + 1.05, y: y + 0.28, w: pw - 1.3, h: 0.5, fontFace: HEAD, fontSize: 19, bold: true, color: BERRY, margin: 0 });
    s.addText(p[1], { x: x + 1.05, y: y + 0.82, w: pw - 1.3, h: 0.85, fontFace: BODY, fontSize: 14, color: MUTED, margin: 0, lineSpacingMultiple: 1.1 });
  });

  // ============ SLIDE 3 — THE SOLUTION ============
  s = pres.addSlide();
  s.background = { color: CREAM };
  // left berry panel
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 5.0, h: H, fill: { color: BERRY } });
  s.addShape(pres.shapes.OVAL, { x: -1.2, y: 5.2, w: 3.6, h: 3.6, fill: { color: ROSEDP, transparency: 60 } });
  s.addImage({ data: ic.hand, x: 0.85, y: 1.0, w: 0.9, h: 0.9 });
  s.addText("The idea", { x: 0.85, y: 2.0, w: 3.5, h: 0.5, fontFace: BODY, fontSize: 15, color: LGOLD, charSpacing: 3, margin: 0 });
  s.addText("Every gift becomes a fundable goal.", {
    x: 0.85, y: 2.5, w: 3.7, h: 2.4, fontFace: HEAD, fontSize: 30, bold: true, italic: true, color: WHITE, margin: 0, lineSpacingMultiple: 1.05
  });
  s.addText("One retailer-agnostic platform blending a wish list, group funding, and cash gifts.", {
    x: 0.85, y: 5.05, w: 3.6, h: 1.4, fontFace: BODY, fontSize: 15, color: "F3E7DF", margin: 0, lineSpacingMultiple: 1.15
  });

  s.addText("What a guest can do with any item", {
    x: 5.6, y: 0.85, w: 7, h: 0.6, fontFace: HEAD, fontSize: 24, bold: true, color: INK, margin: 0
  });
  const sol = [
    [ic.gift, "Buy it outright", "Purchase a whole item in one tap — done."],
    [ic.piggy, "Chip in partially", "Contribute any amount toward a bigger goal: a honeymoon, a fridge, a home deposit."],
    [ic.users, "Join a group gift", "Several guests pool together to fully fund one expensive item."],
    [ic.wallet, "Give to a cash fund", "Add to an open fund — honeymoon, new home, or a chosen charity."],
  ];
  sol.forEach((r, i) => {
    const y = 1.75 + i * 1.28;
    s.addShape(pres.shapes.RECTANGLE, { x: 5.6, y, w: 7.0, h: 1.12, fill: { color: WHITE }, line: { color: SOFT, width: 1 }, shadow: mkShadow() });
    s.addShape(pres.shapes.OVAL, { x: 5.85, y: y + 0.27, w: 0.58, h: 0.58, fill: { color: SOFT } });
    s.addImage({ data: r[0], x: 5.97, y: y + 0.39, w: 0.34, h: 0.34 });
    s.addText(r[1], { x: 6.65, y: y + 0.16, w: 5.7, h: 0.4, fontFace: HEAD, fontSize: 17, bold: true, color: BERRY, margin: 0 });
    s.addText(r[2], { x: 6.65, y: y + 0.54, w: 5.75, h: 0.5, fontFace: BODY, fontSize: 13, color: MUTED, margin: 0, lineSpacingMultiple: 1.0 });
  });

  // ============ SLIDE 4 — HOW IT WORKS ============
  s = pres.addSlide();
  s.background = { color: CREAM };
  s.addText("How Agamos works", { x: 0.9, y: 0.6, w: 11, h: 0.8, fontFace: HEAD, fontSize: 32, bold: true, color: INK, margin: 0 });
  s.addText("Three easy steps for the couple — one for every guest.", { x: 0.9, y: 1.45, w: 11, h: 0.5, fontFace: BODY, fontSize: 16, color: MUTED, margin: 0 });

  const steps = [
    [ic.list, "1", "Build your wish list", "Add gifts from any store, the Agamos catalog, or set cash goals like a honeymoon or home deposit."],
    [ic.share, "2", "Share your page", "Send one beautiful link. Guests see your story, browse what's needed, and pick a gift in seconds."],
    [ic.wallet, "3", "Receive & redeem", "Guests buy or chip in. Withdraw cash or redeem items — then thank everyone with built-in tools."],
  ];
  const cw = 3.85, cgap = 0.42, startx = 0.9;
  steps.forEach((st, i) => {
    const x = startx + i * (cw + cgap), y = 2.4, hh = 3.9;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: cw, h: hh, fill: { color: WHITE }, line: { color: SOFT, width: 1 }, shadow: mkShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: cw, h: 0.14, fill: { color: ROSE } });
    s.addShape(pres.shapes.OVAL, { x: x + cw / 2 - 0.6, y: y + 0.55, w: 1.2, h: 1.2, fill: { color: BERRY } });
    s.addImage({ data: st[0], x: x + cw / 2 - 0.32, y: y + 0.82, w: 0.64, h: 0.64 });
    s.addText("STEP " + st[1], { x, y: y + 1.95, w: cw, h: 0.35, align: "center", fontFace: BODY, fontSize: 12, bold: true, color: ROSEDP, charSpacing: 3, margin: 0 });
    s.addText(st[2], { x: x + 0.3, y: y + 2.3, w: cw - 0.6, h: 0.55, align: "center", fontFace: HEAD, fontSize: 19, bold: true, color: BERRY, margin: 0 });
    s.addText(st[3], { x: x + 0.4, y: y + 2.95, w: cw - 0.8, h: 0.85, align: "center", fontFace: BODY, fontSize: 13.5, color: MUTED, margin: 0, lineSpacingMultiple: 1.1 });
  });

  // ============ SLIDE 5 — FEATURES GRID ============
  s = pres.addSlide();
  s.background = { color: SOFT };
  s.addText("Everything in one place", { x: 0.9, y: 0.55, w: 11, h: 0.8, fontFace: HEAD, fontSize: 32, bold: true, color: INK, margin: 0 });
  s.addText("A wish list, group funding, and cash gifts — with trust and a personal touch.", { x: 0.9, y: 1.4, w: 11.5, h: 0.5, fontFace: BODY, fontSize: 16, color: MUTED, margin: 0 });

  const feats = [
    [ic.gift, "Universal registry", "Add any item from any store by link, or pick from our curated catalog — no lock-in."],
    [ic.piggy, "Fund any goal", "Full-purchase or partial contributions. Honeymoons, homes, charity cash funds."],
    [ic.users, "Group gifting", "Guests pool together to fund one big item, with a live progress bar."],
    [ic.envelope, "Personal messages", "Every gift carries a heartfelt note — and optional photo — from the giver."],
    [ic.lock, "Secure payouts", "Funds held safely; verified payouts. Cards, transfer & mobile money."],
    [ic.check, "Guest checkout", "Well-wishers give in under a minute — no account needed, even from abroad."],
  ];
  const fw = 3.85, fh = 2.15, fgx = 0.42, fgy = 0.4, fx0 = 0.9, fy0 = 2.2;
  feats.forEach((f, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = fx0 + col * (fw + fgx), y = fy0 + row * (fh + fgy);
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: fw, h: fh, fill: { color: WHITE }, shadow: mkShadow() });
    s.addShape(pres.shapes.OVAL, { x: x + 0.35, y: y + 0.35, w: 0.7, h: 0.7, fill: { color: SOFT } });
    s.addImage({ data: f[0], x: x + 0.5, y: y + 0.5, w: 0.4, h: 0.4 });
    s.addText(f[1], { x: x + 1.2, y: y + 0.35, w: fw - 1.4, h: 0.7, fontFace: HEAD, fontSize: 16, bold: true, color: BERRY, margin: 0, valign: "middle" });
    s.addText(f[2], { x: x + 0.4, y: y + 1.15, w: fw - 0.8, h: 0.85, fontFace: BODY, fontSize: 13, color: MUTED, margin: 0, lineSpacingMultiple: 1.1 });
  });

  // ============ SLIDE 6 — FOR COUPLES / FOR GUESTS ============
  s = pres.addSlide();
  s.background = { color: CREAM };
  s.addText("Loved by both sides of the gift", { x: 0.9, y: 0.55, w: 11.5, h: 0.8, fontFace: HEAD, fontSize: 32, bold: true, color: INK, margin: 0 });

  // couple panel
  const colY = 1.7, colH = 5.2;
  s.addShape(pres.shapes.RECTANGLE, { x: 0.9, y: colY, w: 5.7, h: colH, fill: { color: ROSEDP }, shadow: mkShadow() });
  s.addImage({ data: ic.heartW, x: 1.25, y: colY + 0.45, w: 0.6, h: 0.6 });
  s.addText("For the couple", { x: 2.0, y: colY + 0.45, w: 4.3, h: 0.6, fontFace: HEAD, fontSize: 20, bold: true, color: WHITE, margin: 0, valign: "middle" });
  const coupleList = ["One shared list — zero duplicates", "Cash funds for honeymoons & homes", "Track every contribution in real time", "Withdraw cash or redeem items", "Built-in thank-you tracking"];
  coupleList.forEach((t, i) => {
    const y = colY + 1.5 + i * 0.68;
    s.addImage({ data: ic.checkW, x: 1.3, y: y + 0.04, w: 0.32, h: 0.32 });
    s.addText(t, { x: 1.8, y, w: 4.6, h: 0.5, fontFace: BODY, fontSize: 15.5, color: "FBF6F1", margin: 0, valign: "middle" });
  });

  // guest panel
  s.addShape(pres.shapes.RECTANGLE, { x: 6.9, y: colY, w: 5.5, h: colH, fill: { color: "4F4459" }, shadow: mkShadow() });
  s.addImage({ data: ic.hand, x: 7.25, y: colY + 0.45, w: 0.6, h: 0.6 });
  s.addText("For guests & well-wishers", { x: 8.0, y: colY + 0.45, w: 4.3, h: 0.6, fontFace: HEAD, fontSize: 19, bold: true, color: WHITE, margin: 0, valign: "middle" });
  const guestList = ["See exactly what the couple wants", "Buy outright or chip in any amount", "Join a group gift in one tap", "Add a personal message & photo", "Give securely without an account"];
  guestList.forEach((t, i) => {
    const y = colY + 1.5 + i * 0.68;
    s.addImage({ data: ic.checkW, x: 7.3, y: y + 0.04, w: 0.32, h: 0.32 });
    s.addText(t, { x: 7.8, y, w: 4.4, h: 0.5, fontFace: BODY, fontSize: 15.5, color: "F3E7DF", margin: 0, valign: "middle" });
  });

  // ============ SLIDE 7 — MARKET / WHY NOW ============
  s = pres.addSlide();
  s.background = { color: BERRY };
  s.addText("Why now", { x: 0.9, y: 0.7, w: 6, h: 0.5, fontFace: BODY, fontSize: 15, color: LGOLD, charSpacing: 4, margin: 0 });
  s.addText("Cash and experiences are how people gift today.", {
    x: 0.9, y: 1.15, w: 11.5, h: 1.0, fontFace: HEAD, fontSize: 30, bold: true, color: WHITE, margin: 0
  });
  const stats = [
    [ic.globe, "Retailer-agnostic", "Works with any store, any product, any currency — and pure cash funds."],
    [ic.star, "Experience-first", "Honeymoons and homes matter more to couples than another kitchen gadget."],
    [ic.chart, "Group funding gap", "No incumbent does partial + group + cash gifting in one trusted place."],
  ];
  stats.forEach((st, i) => {
    const x = 0.9 + i * 4.0, y = 2.55, w = 3.7, h = 3.4;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: WHITE }, shadow: mkShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x, y, w, h: 0.14, fill: { color: GOLD } });
    s.addImage({ data: st[0], x: x + 0.4, y: y + 0.55, w: 0.8, h: 0.8 });
    s.addText(st[1], { x: x + 0.4, y: y + 1.55, w: w - 0.8, h: 0.6, fontFace: HEAD, fontSize: 20, bold: true, color: BERRY, margin: 0 });
    s.addText(st[2], { x: x + 0.4, y: y + 2.15, w: w - 0.8, h: 1.1, fontFace: BODY, fontSize: 14, color: MUTED, margin: 0, lineSpacingMultiple: 1.15 });
  });
  s.addText("Couples get exactly what they want. Guests give something that truly matters.", {
    x: 0.9, y: 6.35, w: 11.5, h: 0.6, fontFace: HEAD, fontSize: 16, italic: true, color: "F3E7DF", margin: 0
  });

  // ============ SLIDE 8 — BUSINESS MODEL ============
  s = pres.addSlide();
  s.background = { color: CREAM };
  s.addText("How Agamos makes money", { x: 0.9, y: 0.6, w: 11, h: 0.8, fontFace: HEAD, fontSize: 32, bold: true, color: INK, margin: 0 });
  s.addText("Aligned with couples and guests — transparent, optional, low-friction.", { x: 0.9, y: 1.45, w: 11.5, h: 0.5, fontFace: BODY, fontSize: 16, color: MUTED, margin: 0 });

  const biz = [
    ["Platform fee", "A small, transparent fee on cash contributions — with an optional \"cover the fee\" toggle for guests."],
    ["Affiliate revenue", "Commission from catalog and retailer purchases made through the registry."],
    ["Premium pages", "Custom domains, themes, and video for couples who want a standout wedding page."],
  ];
  biz.forEach((b, i) => {
    const x = 0.9 + i * 4.0, y = 2.4, w = 3.7, h = 3.7;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: WHITE }, line: { color: SOFT, width: 1 }, shadow: mkShadow() });
    s.addShape(pres.shapes.OVAL, { x: x + 0.4, y: y + 0.45, w: 0.95, h: 0.95, fill: { color: SOFT } });
    s.addText(String(i + 1), { x: x + 0.4, y: y + 0.45, w: 0.95, h: 0.95, align: "center", valign: "middle", fontFace: HEAD, fontSize: 30, bold: true, color: ROSEDP, margin: 0 });
    s.addText(b[0], { x: x + 0.4, y: y + 1.65, w: w - 0.8, h: 0.6, fontFace: HEAD, fontSize: 20, bold: true, color: BERRY, margin: 0 });
    s.addText(b[1], { x: x + 0.4, y: y + 2.3, w: w - 0.8, h: 1.3, fontFace: BODY, fontSize: 14, color: MUTED, margin: 0, lineSpacingMultiple: 1.2 });
  });

  // ============ SLIDE 9 — ROADMAP ============
  s = pres.addSlide();
  s.background = { color: SOFT };
  s.addText("Phased roadmap", { x: 0.9, y: 0.6, w: 11, h: 0.8, fontFace: HEAD, fontSize: 32, bold: true, color: INK, margin: 0 });
  s.addText("Ship a trusted core first, then deepen funding, reach, and intelligence.", { x: 0.9, y: 1.45, w: 11.5, h: 0.5, fontFace: BODY, fontSize: 16, color: MUTED, margin: 0 });

  const phases = [
    ["Phase 1", "MVP", "Registry builder, fundable goals, guest checkout, secure payouts with KYC, thank-you tracking.", ROSEDP],
    ["Phase 2", "Scale", "Group-gift enhancements, native mobile apps, themes, multi-currency support.", ROSE],
    ["Phase 3", "Expand", "Multi-event support, vendor marketplace, and AI-powered gift suggestions.", GOLD],
  ];
  // connecting line
  s.addShape(pres.shapes.LINE, { x: 1.6, y: 3.0, w: 10.1, h: 0, line: { color: BERRY, width: 2, dashType: "dash" } });
  phases.forEach((p, i) => {
    const x = 0.9 + i * 4.0, y = 2.4, w = 3.7, h = 3.9;
    s.addShape(pres.shapes.OVAL, { x: x + w / 2 - 0.22, y: 2.78, w: 0.44, h: 0.44, fill: { color: p[3] }, line: { color: WHITE, width: 3 } });
    s.addShape(pres.shapes.RECTANGLE, { x, y: 3.5, w, h: 2.8, fill: { color: WHITE }, shadow: mkShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x, y: 3.5, w, h: 0.14, fill: { color: p[3] } });
    s.addText(p[0], { x: x + 0.4, y: 3.75, w: w - 0.8, h: 0.4, fontFace: BODY, fontSize: 13, bold: true, color: MUTED, charSpacing: 3, margin: 0 });
    s.addText(p[1], { x: x + 0.4, y: 4.1, w: w - 0.8, h: 0.6, fontFace: HEAD, fontSize: 24, bold: true, color: BERRY, margin: 0 });
    s.addText(p[2], { x: x + 0.4, y: 4.8, w: w - 0.8, h: 1.4, fontFace: BODY, fontSize: 14, color: MUTED, margin: 0, lineSpacingMultiple: 1.2 });
  });

  // ============ SLIDE 10 — CLOSING ============
  s = pres.addSlide();
  s.background = { color: BERRY };
  s.addShape(pres.shapes.OVAL, { x: -1.5, y: -1.5, w: 4.5, h: 4.5, fill: { color: ROSEDP, transparency: 55 } });
  s.addShape(pres.shapes.OVAL, { x: 10.8, y: 4.6, w: 4.2, h: 4.2, fill: { color: GOLD, transparency: 68 } });
  s.addImage({ data: ic.ring, x: 6.34, y: 1.55, w: 0.62, h: 0.62 });
  s.addText("Agamos", { x: 0, y: 2.45, w: W, h: 1.0, align: "center", fontFace: HEAD, fontSize: 46, bold: true, italic: true, color: WHITE, margin: 0 });
  s.addText("Give what they truly wish for.", { x: 0, y: 3.6, w: W, h: 0.7, align: "center", fontFace: HEAD, fontSize: 22, color: GOLD, margin: 0 });
  s.addText("One shared wish list  ·  Group & cash gifting  ·  Secure payouts  ·  Heartfelt every time", {
    x: 0, y: 4.6, w: W, h: 0.6, align: "center", fontFace: BODY, fontSize: 15, color: "F3E7DF", margin: 0
  });
  s.addShape(pres.shapes.RECTANGLE, { x: W / 2 - 1.9, y: 5.6, w: 3.8, h: 0.78, fill: { color: WHITE } });
  s.addText("Create your registry — free", { x: W / 2 - 1.9, y: 5.6, w: 3.8, h: 0.78, align: "center", valign: "middle", fontFace: BODY, fontSize: 16, bold: true, color: BERRY, margin: 0 });

  await pres.writeFile({ fileName: "Agamos_Pitch_Deck.pptx" });
  console.log("Deck written: Agamos_Pitch_Deck.pptx");
})();
