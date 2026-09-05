"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "../components/AppShell";

export default function HistoryPage() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    try { setItems(JSON.parse(window.localStorage.getItem("revivepay_history") || "[]")); } catch { setItems([]); }
  }, []);
  return <AppShell activeKey="history"><main className="simple-product-page"><header className="product-page-header"><p className="eyebrow">HISTORY</p><h1>Recovery History</h1><p>Cases analyzed by RevivePay and the action that followed.</p></header>{items.length === 0 ? <div className="empty-product-state"><strong>No recovery cases yet.</strong><span>Analyze a failed payment from Recover to see it here.</span><Link href="/recover" className="primary-soft-button inline-link">Analyze a payment</Link></div> : <div className="history-list">{items.map((item) => <Link href={`/recovery/${item.id}`} key={item.id} className="history-item"><div><strong>{item.customerName || "Customer"}</strong><small>{item.failureReason || "Payment issue"}</small></div><strong>{item.amount ? `₹${Number(item.amount).toLocaleString("en-IN")}` : "Amount pending"}</strong><span>{item.status?.replaceAll("_", " ")}</span></Link>)}</div>}</main></AppShell>;
}
