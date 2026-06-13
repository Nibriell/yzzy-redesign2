#!/usr/bin/env python3
"""Trage catalogul real din Store API-ul WooCommerce al yzzy.ro
si genereaza data/catalog.js pentru site-ul demo (conceptul 5).
Ruleaza oricand vrei date proaspete: python3 fetch_catalog.py
"""
import json
import re
import urllib.request
from pathlib import Path

BASE = "https://yzzy.ro/wp-json/wc/store/v1/products"
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}

CATEGORIES = [
    {"key": "telefoane", "id": 19, "count": 60, "label": "Telefoane", "terminal": "T1"},
    {"key": "tablete", "id": 96, "count": 19, "label": "Tablete", "terminal": "T2"},
    {"key": "laptopuri", "id": 20, "count": 17, "label": "Laptopuri", "terminal": "T3"},
    {"key": "smartwatch", "id": 135, "count": 24, "label": "Smartwatch", "terminal": "T4"},
    {"key": "accesorii", "id": 22, "count": 32, "label": "Accesorii", "terminal": "T5"},
]

CONDITIONS = ["nou sigilat", "nou desigilat", "ca nou", "excelent", "foarte bun", "bun"]
BRANDS = ["APPLE", "SAMSUNG", "HUAWEI", "XIAOMI", "GOOGLE", "LENOVO", "ASUS", "HP", "DELL", "GARMIN", "ONEPLUS"]


def strip_tags(html):
    txt = re.sub(r"<[^>]+>", " ", html or "")
    txt = re.sub(r"&nbsp;|&#\d+;|&[a-z]+;", " ", txt)
    return re.sub(r"\s+", " ", txt).strip()


def trunc(txt, n):
    if len(txt) <= n:
        return txt
    return txt[:n].rsplit(" ", 1)[0].rstrip(" ,.;:-") + "…"


def clean(p, cat_key):
    raw = p["name"]
    cond = next((c for c in CONDITIONS if c in raw.lower()), None)
    brand = next((b for b in BRANDS if raw.upper().startswith(b)), None)
    name = re.sub(r"^(%s)\s+" % "|".join(BRANDS), "", raw, flags=re.I)
    if cond:
        name = re.sub(re.escape(cond) + r".*$", "", name, flags=re.I)
    name = re.sub(r"\s+YZZY\s*$", "", name, flags=re.I).strip(" ,-")
    slug = p["permalink"].rstrip("/").rsplit("/", 1)[-1]
    imgs = [i["src"] for i in p["images"][:4]]
    thumb = p["images"][0]["thumbnail"] if p["images"] else None
    default_cond = "nou" if cat_key == "accesorii" else "verificat"
    return {
        "id": slug,
        "cat": cat_key,
        "brand": (brand or "").capitalize(),
        "name": name,
        "condition": (cond or default_cond).capitalize(),
        "price": int(p["prices"]["price"]),
        "regular": int(p["prices"]["regular_price"] or p["prices"]["price"]),
        "on_sale": p["on_sale"],
        "thumb": thumb,
        "imgs": imgs,
        "short": trunc(strip_tags(p.get("short_description")), 180),
        "desc": trunc(strip_tags(p.get("description")), 600),
        "url": p["permalink"],
    }


products, seen = [], set()
for cat in CATEGORIES:
    url = f"{BASE}?category={cat['id']}&per_page={min(cat['count'], 100)}&orderby=date&order=desc"
    req = urllib.request.Request(url, headers=UA)
    raw = json.load(urllib.request.urlopen(req))
    n = 0
    for p in raw:
        c = clean(p, cat["key"])
        if not c["thumb"] or c["id"] in seen:
            continue
        seen.add(c["id"])
        products.append(c)
        n += 1
    print(f"{cat['key']}: {n} produse")

out = {
    "cats": [{"key": c["key"], "label": c["label"], "terminal": c["terminal"]} for c in CATEGORIES],
    "products": products,
}
Path("data").mkdir(exist_ok=True)
with open("data/catalog.js", "w", encoding="utf-8") as f:
    f.write("// generat de fetch_catalog.py — date reale din yzzy.ro Store API\n")
    f.write("window.YZZY_DATA = ")
    json.dump(out, f, ensure_ascii=False)
    f.write(";\n")

print(f"OK — {len(products)} produse in data/catalog.js")
