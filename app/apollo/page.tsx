"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"

type Contact = {
  company: string
  name: string
  role: string
  email: string
  phone: string
  category: string
  fitScore: number
  notes: string
}

const DATABASE: Contact[] = [
  { company: "Red Bull India",    name: "Arjun Mehta",    role: "Brand Partnerships Lead",   email: "partnerships@redbull.in",    phone: "+91 98765 43210", category: "FMCG",        fitScore: 91, notes: "Youth-centric, campus activations" },
  { company: "Nike India",        name: "Priya Kapoor",   role: "Marketing Head",             email: "priya.kapoor@nike.com",      phone: "+91 98001 12345", category: "Lifestyle",   fitScore: 88, notes: "Sports + campus demographics match" },
  { company: "ASUS India",        name: "Rohan Parab",    role: "Corporate Alliances",        email: "rohan.parab@asus.com",       phone: "+91 80000 44321", category: "Tech",        fitScore: 84, notes: "Tech brand, student audience" },
  { company: "Swiggy",            name: "Neha Sharma",    role: "Campus Marketing",           email: "campus@swiggy.in",           phone: "+91 76543 21098", category: "Food",        fitScore: 78, notes: "Heavy campus presence" },
  { company: "Decathlon India",   name: "Rahul Bose",     role: "Sponsorship Manager",        email: "rahul.bose@decathlon.com",   phone: "+91 91234 56780", category: "Sports",      fitScore: 72, notes: "Sports + college events" },
  { company: "Boat",              name: "Siddharth Rao",  role: "Brand Activation Lead",      email: "sid.rao@boat.com",           phone: "+91 99876 54321", category: "Tech",        fitScore: 80, notes: "Youth audio brand" },
  { company: "Zomato",            name: "Ankita Joshi",   role: "Partnerships",               email: "brand@zomato.com",           phone: "+91 70000 11234", category: "Food",        fitScore: 75, notes: "Food brand, event activations" },
  { company: "Myntra",            name: "Kavita Singh",   role: "Campus Lead",                email: "campus@myntra.com",          phone: "+91 88765 43210", category: "Lifestyle",   fitScore: 70, notes: "Fashion + Gen Z audience" },
  { company: "Puma India",        name: "Dev Anand",      role: "Marketing Director",         email: "dev.anand@puma.com",         phone: "+91 93456 78901", category: "Sports",      fitScore: 83, notes: "Sportswear, campus tie-ups" },
  { company: "Samsung India",     name: "Anjali Verma",   role: "College Partnerships",       email: "anjali.v@samsung.com",       phone: "+91 85678 90123", category: "Tech",        fitScore: 76, notes: "Electronics + student market" },
  { company: "Amul",              name: "Ratan Patel",    role: "Events Manager",             email: "events@amul.in",             phone: "+91 92345 67890", category: "FMCG",        fitScore: 65, notes: "Cultural events sponsor" },
  { company: "Ola Electric",      name: "Meena Iyer",     role: "Brand Head",                 email: "meena@olaelectric.com",      phone: "+91 99001 23456", category: "EV",          fitScore: 79, notes: "Youth + sustainability" },
]

const CATEGORIES = ["All", "FMCG", "Tech", "Lifestyle", "Food", "Sports", "EV"]

const scoreColor = (s: number) => {
  if (s >= 85) return "#4ade80"
  if (s >= 75) return "#D4AF37"
  return "#60a5fa"
}

const scoreLabel = (s: number) => {
  if (s >= 85) return "Hot"
  if (s >= 75) return "Warm"
  return "Prospect"
}

export default function ApolloPage() {
  const [query, setQuery]           = useState("")
  const [category, setCategory]     = useState("All")
  const [selected, setSelected]     = useState<Contact | null>(null)
  const [imported, setImported]     = useState<Set<string>>(new Set())
  const [importFlash, setImportFlash] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return DATABASE.filter(c => {
      const matchesSearch = !query ||
        c.company.toLowerCase().includes(query.toLowerCase()) ||
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.role.toLowerCase().includes(query.toLowerCase())
      const matchesCat = category === "All" || c.category === category
      return matchesSearch && matchesCat
    })
  }, [query, category])

  function importContact(c: Contact) {
    setImported(prev => new Set(prev).add(c.company))
    setImportFlash(c.company)
    setTimeout(() => setImportFlash(null), 2000)
  }

  function openApollo(company?: string) {
    const url = company
      ? `https://app.apollo.io/#/people?organizationNames[]=${encodeURIComponent(company)}`
      : "https://app.apollo.io/#/people?personTitles[]=marketing"
    window.open(url, "_blank")
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1600, margin: "0 auto" }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 24, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(212,175,55,0.6)", marginBottom: 6 }}>
            Intel · Sponsor Intelligence Finder
          </div>
          <h1 style={{ fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 900, letterSpacing: "-0.02em", color: "#f6e7c9", margin: 0 }}>
            Apollo Intel Console
          </h1>
          <p style={{ color: "rgba(246,231,201,0.4)", fontSize: 13, marginTop: 6 }}>
            {filtered.length} contacts in database · {imported.size} imported to CRM
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="btn-ghost"
            onClick={() => openApollo()}
            style={{ fontSize: 12 }}
          >
            ↗ Open Apollo.io
          </button>
          <button className="btn-gold" style={{ fontSize: 12 }}>
            ⬇ Export Intel
          </button>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Contacts",    value: DATABASE.length,                                           color: "#D4AF37" },
          { label: "Hot Leads (85%+)",  value: DATABASE.filter(c => c.fitScore >= 85).length,             color: "#4ade80" },
          { label: "Imported to CRM",   value: imported.size,                                             color: "#60a5fa" },
          { label: "Avg Fit Score",      value: Math.round(DATABASE.reduce((a, c) => a + c.fitScore, 0) / DATABASE.length) + "%", color: "#c084fc" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            style={{
              padding: "16px 20px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(212,175,55,0.12)",
              borderRadius: 16,
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 900, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 10, color: "rgba(246,231,201,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 3 }}>{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Search + Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}
      >
        <div style={{ flex: 1, minWidth: 240, display: "flex", alignItems: "center", gap: 10, padding: "0 14px", background: "rgba(0,0,0,0.35)", border: "1px solid rgba(212,175,55,0.15)", borderRadius: 12 }}>
          <span style={{ fontSize: 16, color: "rgba(212,175,55,0.5)" }}>⌕</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search company, contact, role..."
            style={{ flex: 1, padding: "12px 0", background: "transparent", border: "none", color: "#f6e7c9", fontSize: 13, fontFamily: "inherit", outline: "none" }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ background: "none", border: "none", color: "rgba(246,231,201,0.4)", cursor: "pointer", fontSize: 16 }}>×</button>
          )}
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                border: `1px solid ${category === cat ? "rgba(212,175,55,0.4)" : "rgba(212,175,55,0.12)"}`,
                background: category === cat ? "rgba(212,175,55,0.12)" : "transparent",
                color: category === cat ? "#D4AF37" : "rgba(246,231,201,0.45)",
                fontSize: 11, fontWeight: category === cat ? 700 : 400,
                cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.18s",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {!filtered.some(c => c.company.toLowerCase().includes(query.toLowerCase())) && query.length > 2 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="btn-ghost"
            onClick={() => openApollo(query)}
            style={{ fontSize: 12 }}
          >
            ↗ Search "{query}" on Apollo.io
          </motion.button>
        )}
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 360px" : "1fr", gap: 20 }}>

        {/* Table */}
        <motion.div
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="panel"
          style={{ padding: 0, overflow: "hidden" }}
        >
          <div style={{ overflowX: "auto" }}>
            <table className="g-table" style={{ minWidth: 800 }}>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Category</th>
                  <th>Fit Score</th>
                  <th>Email</th>
                  <th style={{ paddingRight: 16 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((contact, i) => {
                  const color = scoreColor(contact.fitScore)
                  const isImported = imported.has(contact.company)
                  return (
                    <motion.tr
                      key={contact.company}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.02, 0.3) }}
                      style={{ cursor: "pointer", background: selected?.company === contact.company ? "rgba(212,175,55,0.05)" : undefined }}
                      onClick={() => setSelected(prev => prev?.company === contact.company ? null : contact)}
                    >
                      <td style={{ fontWeight: 700, color: "#f6e7c9", fontSize: 13 }}>{contact.company}</td>
                      <td style={{ fontSize: 12, color: "rgba(246,231,201,0.75)" }}>{contact.name}</td>
                      <td style={{ fontSize: 11, color: "rgba(246,231,201,0.5)" }}>{contact.role}</td>
                      <td>
                        <span className="badge badge-purple" style={{ fontSize: 10 }}>{contact.category}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 4 }}>
                            <div style={{ width: `${contact.fitScore}%`, height: "100%", background: color, borderRadius: 4 }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 800, color, minWidth: 30 }}>{contact.fitScore}%</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 11, color: "rgba(246,231,201,0.5)" }}>{contact.email}</td>
                      <td style={{ paddingRight: 16 }}>
                        <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                          {isImported ? (
                            <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 700 }}>✓ In CRM</span>
                          ) : (
                            <button
                              className="btn-gold"
                              style={{ padding: "5px 10px", fontSize: 10 }}
                              onClick={() => importContact(contact)}
                            >
                              Import
                            </button>
                          )}
                          <button
                            className="btn-ghost"
                            style={{ padding: "5px 10px", fontSize: 10 }}
                            onClick={() => openApollo(contact.company)}
                          >
                            ↗
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div style={{ padding: "40px", textAlign: "center" }}>
              <div style={{ fontSize: 14, color: "rgba(246,231,201,0.3)", marginBottom: 14 }}>
                No contacts found for "{query}"
              </div>
              <button
                className="btn-gold"
                onClick={() => openApollo(query)}
                style={{ fontSize: 12 }}
              >
                ↗ Search on Apollo.io
              </button>
            </div>
          )}
        </motion.div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="panel"
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#f6e7c9" }}>{selected.company}</div>
                  <div style={{ fontSize: 12, color: "rgba(246,231,201,0.45)", marginTop: 3 }}>{selected.category}</div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  style={{ background: "none", border: "none", color: "rgba(246,231,201,0.4)", cursor: "pointer", fontSize: 18, lineHeight: 1 }}
                >
                  ×
                </button>
              </div>

              {/* Fit Score */}
              <div style={{ padding: "14px 16px", background: "rgba(255,255,255,0.04)", borderRadius: 12, border: `1px solid ${scoreColor(selected.fitScore)}30` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: "rgba(246,231,201,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Fit Score</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: scoreColor(selected.fitScore) }}>
                    {selected.fitScore}% — {scoreLabel(selected.fitScore)}
                  </span>
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 6 }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${selected.fitScore}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    style={{ height: "100%", background: scoreColor(selected.fitScore), borderRadius: 6 }}
                  />
                </div>
              </div>

              {/* Contact info */}
              <div className="g-divider" />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Name",  value: selected.name  },
                  { label: "Role",  value: selected.role  },
                  { label: "Email", value: selected.email },
                  { label: "Phone", value: selected.phone },
                ].map(row => (
                  <div key={row.label}>
                    <div style={{ fontSize: 10, color: "rgba(246,231,201,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>{row.label}</div>
                    <div style={{ fontSize: 13, color: "#f6e7c9" }}>{row.value}</div>
                  </div>
                ))}
              </div>

              {/* Notes */}
              <div className="g-divider" />
              <div>
                <div style={{ fontSize: 10, color: "rgba(246,231,201,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Intel Notes</div>
                <div style={{ fontSize: 12, color: "rgba(246,231,201,0.6)", lineHeight: 1.7, padding: "10px 12px", background: "rgba(0,0,0,0.25)", borderRadius: 10, border: "1px solid rgba(212,175,55,0.1)" }}>
                  {selected.notes}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: "auto" }}>
                {imported.has(selected.company) ? (
                  <div style={{ textAlign: "center", fontSize: 13, color: "#4ade80", fontWeight: 700, padding: "10px" }}>
                    ✓ Imported to CRM
                  </div>
                ) : (
                  <button className="btn-gold" onClick={() => importContact(selected)} style={{ justifyContent: "center" }}>
                    Import to Lead Vault
                  </button>
                )}
                <button
                  className="btn-ghost"
                  onClick={() => window.open(`mailto:${selected.email}?subject=Sponsorship Collaboration | Dandiya Night %2726 | Club Garuda, MUJ`, "_blank")}
                  style={{ justifyContent: "center", fontSize: 12 }}
                >
                  Send Email
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => openApollo(selected.company)}
                  style={{ justifyContent: "center", fontSize: 12 }}
                >
                  ↗ View on Apollo.io
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Import flash notification */}
      <AnimatePresence>
        {importFlash && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: "fixed", bottom: 28, right: 28,
              padding: "14px 20px",
              background: "rgba(74,222,128,0.12)",
              border: "1px solid rgba(74,222,128,0.3)",
              borderRadius: 14,
              fontSize: 13, fontWeight: 700, color: "#4ade80",
              backdropFilter: "blur(12px)",
              zIndex: 9999,
            }}
          >
            ✓ {importFlash} imported to Lead Vault
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
