import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, getClientIp } from "@/lib/rateLimit"

export interface CostResult {
  procedureName:    string
  avgCostInsured:   number | null
  avgCostUninsured: number | null
  minCost:          number | null
  maxCost:          number | null
  currency:         string
  source:           string | null
  savings:          number | null
}

export async function GET(req: NextRequest) {
  const { ok } = checkRateLimit(getClientIp(req))
  if (!ok) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })

  const q = req.nextUrl.searchParams.get("q")?.trim()

  if (!q) {
    // Return distinct procedure names for autocomplete (top 20)
    const rows = await prisma.costEstimate.findMany({
      where:   { region: "US" },
      select:  { procedureName: true },
      orderBy: { procedureName: "asc" },
      take:    100,
    })
    // deduplicate
    const names = Array.from(new Set(rows.map((r) => r.procedureName))).slice(0, 20)
    return NextResponse.json(names)
  }

  // Fuzzy search across all matching records, aggregate per procedureName
  const rows = await prisma.costEstimate.findMany({
    where: {
      region: "US",
      procedureName: { contains: q, mode: "insensitive" },
    },
    orderBy: { procedureName: "asc" },
  })

  if (rows.length === 0) {
    return NextResponse.json([])
  }

  // Group by procedureName and aggregate
  const grouped = new Map<string, typeof rows>()
  for (const row of rows) {
    const existing = grouped.get(row.procedureName) ?? []
    existing.push(row)
    grouped.set(row.procedureName, existing)
  }

  const results: CostResult[] = Array.from(grouped.entries()).map(([name, items]) => {
    const insured   = items.map((i) => i.avgCostInsured).filter((v): v is number => v != null)
    const uninsured = items.map((i) => i.avgCostUninsured).filter((v): v is number => v != null)
    const allCosts  = [...insured, ...uninsured]

    const avgInsured   = insured.length   ? insured.reduce((a, b) => a + b, 0) / insured.length     : null
    const avgUninsured = uninsured.length ? uninsured.reduce((a, b) => a + b, 0) / uninsured.length : null
    const minCost      = allCosts.length  ? Math.min(...allCosts)   : null
    const maxCost      = allCosts.length  ? Math.max(...allCosts)   : null
    const savings      = avgInsured != null && avgUninsured != null ? avgUninsured - avgInsured : null

    return {
      procedureName:    name,
      avgCostInsured:   avgInsured   != null ? Math.round(avgInsured)   : null,
      avgCostUninsured: avgUninsured != null ? Math.round(avgUninsured) : null,
      minCost:          minCost      != null ? Math.round(minCost)      : null,
      maxCost:          maxCost      != null ? Math.round(maxCost)      : null,
      currency:         items[0].currency,
      source:           items[0].source,
      savings:          savings      != null ? Math.round(savings)      : null,
    }
  })

  return NextResponse.json(results)
}
