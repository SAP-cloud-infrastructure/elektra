import React, { useMemo, useState } from "react"
import moment from "moment"
import { useQuery } from "@tanstack/react-query"
import { useAuthData, useAuthProject, useGlobalsEndpoint } from "./StoreProvider"
import { RankingEntry, MailLogEntry, MailSearchOptions, dataFn } from "../actions"
import {
  Container,
  DataGrid,
  DataGridCell,
  DataGridHeadCell,
  DataGridRow,
  LoadingIndicator,
  Message,
  Stack,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@cloudoperators/juno-ui-components"

const PAGE_SIZES = [15, 30, 50, 100]
const DEFAULT_PAGE_SIZE = 100
const DAYS_KEY = "email_service_report_days"

const fmt = (n: number | undefined) => (n ?? 0).toLocaleString()

const DAYS = [1, 2, 3, 4, 5, 6, 7]

const getInitialDays = (): number => {
  const stored = localStorage.getItem(DAYS_KEY)
  if (stored) {
    const n = parseInt(stored, 10)
    if (DAYS.includes(n)) return n
  }
  return 1
}

const DaySelector: React.FC<{ selected: number; onChange: (d: number) => void }> = ({ selected, onChange }) => (
  <div style={{ display: "flex", gap: 6 }}>
    {DAYS.map((d) => (
      <button
        key={d}
        onClick={() => onChange(d)}
        style={{
          padding: "4px 12px",
          borderRadius: 4,
          border: "1px solid var(--color-border, #e0e0e0)",
          cursor: "pointer",
          fontWeight: selected === d ? 700 : 400,
          background: selected === d ? "#038bc6" : "none",
          color: selected === d ? "#ffffff" : undefined,
          fontSize: 13,
        }}
      >
        {d}d
      </button>
    ))}
  </div>
)

const StatCard: React.FC<{ label: string; value: string; sub: string; borderColor?: string; valueColor?: string }> = ({ label, value, sub, borderColor, valueColor }) => (
  <div
    style={{
      flex: 1,
      background: "var(--color-background-lvl-1, #f5f5f5)",
      border: `1px solid ${borderColor ?? "var(--color-border, #e0e0e0)"}`,
      borderRadius: 4,
      padding: "16px 20px",
    }}
  >
    <div style={{ fontSize: 12, color: "var(--color-text-lighter, #666)", marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: valueColor }}>{value}</div>
    <div style={{ fontSize: 12, color: "var(--color-text-lighter, #666)", marginTop: 6 }}>{sub}</div>
  </div>
)

const keyOf = (resp: string): string => {
  const parts = resp.split(" ")
  return /^\d\.\d+\.\d+$/.test(parts[1] ?? "") ? `${parts[0]} ${parts[1]}` : parts[0]
}

const BarRow: React.FC<{ entry: RankingEntry & { key: string; fullName: string }; max: number; selected: boolean; onClick: () => void }> = ({ entry, max, selected, onClick }) => {
  const pct = max > 0 ? (entry.total / max) * 100 : 0
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 12, padding: "6px 8px", borderRadius: 4,
        cursor: "pointer",
        background: "transparent",
        border: selected ? "1px solid #038bc6" : "1px solid transparent",
        transition: "border-color 0.1s",
      }}
    >
      <Tooltip triggerEvent="hover">
        <TooltipTrigger asChild>
          <div
            style={{
              width: 280,
              fontSize: 13,
              fontWeight: 600,
              flexShrink: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {entry.fullName}
          </div>
        </TooltipTrigger>
        <TooltipContent>{entry.fullName}</TooltipContent>
      </Tooltip>
      <div style={{ flex: 1, background: "var(--color-border, #e0e0e0)", borderRadius: 2, height: 12 }}>
        <div
          style={{
            width: `${pct}%`,
            background: "#038bc6",
            height: "100%",
            borderRadius: 2,
          }}
        />
      </div>
      <div style={{ width: 50, textAlign: "right", fontSize: 13, flexShrink: 0 }}>{fmt(entry.total)}</div>
    </div>
  )
}

const errorType = (code: string | undefined): "PERM" | "TEMP" | null => {
  const n = parseInt(code ?? "0", 10)
  if (n >= 500) return "PERM"
  if (n >= 400) return "TEMP"
  return null
}

interface ErrorEvent {
  time: string
  sender: string
  recipient: string
  response: string
  code: string
  type: "PERM" | "TEMP"
  requestId: string
  messageId: string
}

const extractErrorEvents = (entries: MailLogEntry[]): ErrorEvent[] => {
  const events: ErrorEvent[] = []
  for (const entry of entries) {
    const rcptEvents: ErrorEvent[] = []
    for (const rcpt of entry.rcpts ?? []) {
      const code = rcpt.response?.code ?? ""
      const t = errorType(code)
      if (!t) continue
      const msg = [String(code), rcpt.response?.ext, rcpt.response?.msg].filter(Boolean).join(" ")
      rcptEvents.push({
        time: entry.date,
        sender: entry.from,
        recipient: rcpt.rcpt,
        response: msg,
        code: String(code),
        type: t,
        requestId: entry.id,
        messageId: entry.messageId,
      })
    }

    if (rcptEvents.length > 0) {
      events.push(...rcptEvents)
      continue
    }

    // Fall back: whole-mail rejection (DATA/policy phase — rcpts have code 0,
    // but the mail-level response carries the error)
    const mailCode = entry.response?.code
    const mailCodeStr = mailCode !== undefined ? String(mailCode) : undefined
    const t = errorType(mailCodeStr)
    if (t) {
      const msg = [mailCodeStr, entry.response?.ext, entry.response?.msg].filter(Boolean).join(" ")
      for (const rcpt of entry.rcpts ?? []) {
        events.push({
          time: entry.date,
          sender: entry.from,
          recipient: rcpt.rcpt,
          response: msg,
          code: mailCodeStr ?? "",
          type: t,
          requestId: entry.id,
          messageId: entry.messageId,
        })
      }
      continue
    }

    // Also scan attempt-level dialog (catches 421 DIAL / connection-phase errors on
    // mails that eventually delivered so rcpts show success)
    for (const attempt of entry.attempts ?? []) {
      for (const phase of ["mailFrom", "data"] as const) {
        const r = attempt.dialog?.[phase]?.response
        const code = r?.code ?? ""
        const at = errorType(code)
        if (!at) continue
        const msg = [String(code), r?.msg].filter(Boolean).join(" ")
        for (const rcpt of entry.rcpts ?? []) {
          events.push({
            time: attempt.date ?? entry.date,
            sender: entry.from,
            recipient: rcpt.rcpt,
            response: msg,
            code: String(code),
            type: at,
            requestId: entry.id,
            messageId: entry.messageId,
          })
        }
      }
    }
  }
  return events
}

const TypeBadge: React.FC<{ type: "PERM" | "TEMP" }> = ({ type }) => (
  <span
    style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 700,
      background: type === "PERM" ? "#fee2e2" : "#fef3c7",
      color: type === "PERM" ? "#991b1b" : "#92400e",
      border: `1px solid ${type === "PERM" ? "#fca5a5" : "#fcd34d"}`,
    }}
  >
    {type}
  </span>
)

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
}

const FullCell: React.FC<{ value: string | undefined; mono?: boolean }> = ({ value, mono }) => (
  <span style={mono ? { fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" } : { wordBreak: "break-word" }}>
    {value || "-"}
  </span>
)

const btnStyle = (disabled: boolean): React.CSSProperties => ({
  padding: "4px 12px", borderRadius: 4, border: "1px solid var(--color-border, #e0e0e0)",
  cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.4 : 1, background: "none", fontSize: 13,
})

const PaginationBar: React.FC<{
  page: number
  totalPages: number
  pageSize: number
  totalHits: number
  onPrev: () => void
  onNext: () => void
  onPageSize: (n: number) => void
}> = ({ page, totalPages, pageSize, totalHits, onPrev, onNext, onPageSize }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 24px", borderTop: "1px solid #e5e7eb" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
      <span style={{ color: "var(--color-text-lighter, #666)" }}>Rows per page:</span>
      <select
        value={pageSize}
        onChange={(e) => onPageSize(Number(e.target.value))}
        style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid var(--color-border, #e0e0e0)", fontSize: 13, cursor: "pointer" }}
      >
        {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
      <span style={{ color: "var(--color-text-lighter, #666)" }}>{totalHits} total</span>
      <button onClick={onPrev} disabled={page === 1} style={btnStyle(page === 1)}>‹ Prev</button>
      <span>Page {page} of {totalPages}</span>
      <button onClick={onNext} disabled={page === totalPages} style={btnStyle(page === totalPages)}>Next ›</button>
    </div>
  </div>
)

const fetchAllTagged = async (
  bearerToken: string,
  endpoint: string,
  options: Omit<MailSearchOptions, "page" | "pageSize">
): Promise<MailLogEntry[]> => {
  const first = await dataFn({ queryKey: ["data", bearerToken, endpoint, { ...options, page: 1, pageSize: 100 }] })
  const total = first.hits
  if (total <= 100) return first.data ?? []
  const extraPages = Math.ceil((total - 100) / 100)
  const rest = await Promise.all(
    Array.from({ length: extraPages }, (_, i) =>
      dataFn({ queryKey: ["data", bearerToken, endpoint, { ...options, page: i + 2, pageSize: 100 }] })
    )
  )
  return [...(first.data ?? []), ...rest.flatMap((r) => r.data ?? [])]
}

const ErrorReport: React.FC = () => {
  const token = useAuthData()
  const project = useAuthProject()
  const endpoint = useGlobalsEndpoint()

  const [days, setDays] = useState<number>(getInitialDays)
  const [errorPage, setErrorPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const now = useMemo(() => new Date(), [])
  const start = useMemo(() => new Date(now.getTime() - days * 24 * 60 * 60 * 1000), [now, days])

  const handleDaysChange = (d: number) => {
    setDays(d)
    setErrorPage(1)
    setSelectedCode(null)
    localStorage.setItem(DAYS_KEY, String(d))
  }

  // Fetch ALL mails (no tag filter) so we capture 4xx errors on mails that
  // eventually delivered (not in tag=failed or tag=delayed)
  const allMailsResult = useQuery<MailLogEntry[], Error>({
    queryKey: ["chart-all", token, endpoint, start.toISOString(), now.toISOString(), project],
    queryFn: () => fetchAllTagged(token ?? "", endpoint ?? "", { start, end: now, project: project ?? undefined }),
    enabled: !!token,
    keepPreviousData: true,
  })

  const isFetching = allMailsResult.isFetching

  const tableIsLoading = allMailsResult.isLoading
  const tableIsError = allMailsResult.isError
  const tableError = allMailsResult.error

  const allChartErrorEvents = useMemo(() => {
    const events = extractErrorEvents(allMailsResult.data ?? [])
    return events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  }, [allMailsResult.data])

  const chartPermErrs = useMemo(() => allChartErrorEvents.filter((e) => e.type === "PERM").length, [allChartErrorEvents])
  const chartTempErrs = useMemo(() => allChartErrorEvents.filter((e) => e.type === "TEMP").length, [allChartErrorEvents])

  const filteredForTable = useMemo(() => {
    if (!selectedCode) return allChartErrorEvents
    return allChartErrorEvents.filter((ev) => keyOf(ev.response) === selectedCode)
  }, [allChartErrorEvents, selectedCode])

  const pagedErrorEvents = useMemo(() => {
    return filteredForTable.slice((errorPage - 1) * pageSize, errorPage * pageSize)
  }, [filteredForTable, errorPage, pageSize])

  const topErrorResponses = useMemo(() => {
    const aggregated: Record<string, { count: number; fullName: string }> = {}
    for (const ev of allChartErrorEvents) {
      const key = keyOf(ev.response)
      if (!key) continue
      const ex = aggregated[key]
      if (!ex) {
        aggregated[key] = { count: 1, fullName: ev.response }
      } else {
        ex.count += 1
        if (ev.response.length > ex.fullName.length) ex.fullName = ev.response
      }
    }
    return Object.entries(aggregated)
      .map(([key, { count, fullName }]) => ({ key, name: key, fullName, total: count, share: 0 }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
  }, [allChartErrorEvents])

  const maxBar = topErrorResponses[0]?.total ?? 1

  const totalErrorHits = filteredForTable.length
  const totalErrorPages = Math.max(1, Math.ceil(totalErrorHits / pageSize))

  return (
    <Container style={{ paddingTop: 16 }}>

      {/* Stats cards */}
      <div style={{ position: "relative" }}>
        {isFetching && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(255,255,255,0.7)", zIndex: 10, borderRadius: 12 }} />
        )}
        <div style={{ ...cardStyle, padding: 24, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Error Report</div>
            <DaySelector selected={days} onChange={handleDaysChange} />
          </div>
          {allMailsResult.isLoading ? (
            <Stack alignment="center" distribution="center" style={{ minHeight: 80 }}>
              <LoadingIndicator />
            </Stack>
          ) : (
            <div style={{ display: "flex", gap: 12 }}>
              <StatCard label="Total Error Events" value={fmt(allChartErrorEvents.length)} sub="All error events" borderColor="#038bc6" valueColor="#038bc6" />
              <StatCard label="Temporary (4xx)" value={fmt(chartTempErrs)} sub="Temp failures & retries" borderColor="#fcd34d" valueColor="#ca8a04" />
              <StatCard label="Permanent (5xx)" value={fmt(chartPermErrs)} sub="Perm delivery failures" borderColor="#fca5a5" valueColor="#991b1b" />
            </div>
          )}
        </div>

        {/* Top Error Responses */}
        <div style={{ ...cardStyle, padding: 24, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Error Summary</div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>click a row to filter the table</div>
          </div>
          {allMailsResult.isLoading ? (
            <Stack alignment="center" distribution="center" style={{ minHeight: 80 }}>
              <LoadingIndicator />
            </Stack>
          ) : topErrorResponses.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingBottom: 4 }}>
              {topErrorResponses.map((entry) => (
                <BarRow
                  key={entry.key}
                  entry={entry}
                  max={maxBar}
                  selected={selectedCode === entry.key}
                  onClick={() => { setSelectedCode((c) => c === entry.key ? null : entry.key); setErrorPage(1) }}
                />
              ))}
            </div>
          ) : (
            <div style={{ color: "var(--color-text-lighter, #666)", fontSize: 13 }}>No error responses in the selected time range.</div>
          )}
        </div>

        {/* Error Events table */}
        <div style={{ ...cardStyle, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 24px 16px", minHeight: 72 }}>
            <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1 }}>Error Events</div>
            {selectedCode && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: "#9ca3af" }}>filtered to:</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid #038bc6", borderRadius: 4, padding: "3px 10px", fontSize: 13, lineHeight: 1 }}>
                  <span>{selectedCode}</span>
                  <button onClick={() => setSelectedCode(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
                </div>
              </div>
            )}
          </div>
          {tableIsError && (
            <Message variant="error" className="mb-4">
              <p>{tableError?.message ?? "Failed to load error events"}</p>
            </Message>
          )}
          <PaginationBar page={errorPage} totalPages={totalErrorPages} pageSize={pageSize} totalHits={totalErrorHits} onPrev={() => setErrorPage((p) => Math.max(1, p - 1))} onNext={() => setErrorPage((p) => Math.min(totalErrorPages, p + 1))} onPageSize={(s) => { setPageSize(s); setErrorPage(1) }} />
          {tableIsLoading ? (
            <Stack alignment="center" distribution="center" style={{ minHeight: 120 }}>
              <LoadingIndicator />
            </Stack>
          ) : (
            <div className="datagrid-hover">
              <DataGrid columns={8}>
                <DataGridRow>
                  <DataGridHeadCell>Time</DataGridHeadCell>
                  <DataGridHeadCell>Sender</DataGridHeadCell>
                  <DataGridHeadCell>Recipient</DataGridHeadCell>
                  <DataGridHeadCell>Response</DataGridHeadCell>
                  <DataGridHeadCell>Code</DataGridHeadCell>
                  <DataGridHeadCell>Type</DataGridHeadCell>
                  <DataGridHeadCell>Request ID</DataGridHeadCell>
                  <DataGridHeadCell>Message ID</DataGridHeadCell>
                </DataGridRow>
                {pagedErrorEvents.length > 0 ? (
                  pagedErrorEvents.map((ev, i) => (
                    <DataGridRow key={i} style={{ background: i % 2 === 0 ? "#ffffff" : "#f9fafb" }}>
                      <DataGridCell>
                        {moment(ev.time).format("YYYY-MM-DD, HH:mm:ss")}
                        <p>UTC: {moment(ev.time).utc().format("YYYY-MM-DD, HH:mm:ss")}</p>
                      </DataGridCell>
                      <DataGridCell><FullCell value={ev.sender} /></DataGridCell>
                      <DataGridCell><FullCell value={ev.recipient} /></DataGridCell>
                      <DataGridCell><FullCell value={ev.response} /></DataGridCell>
                      <DataGridCell>{ev.code || "-"}</DataGridCell>
                      <DataGridCell><TypeBadge type={ev.type} /></DataGridCell>
                      <DataGridCell><FullCell value={ev.requestId} mono /></DataGridCell>
                      <DataGridCell><FullCell value={ev.messageId} mono /></DataGridCell>
                    </DataGridRow>
                  ))
                ) : (
                  <DataGridRow>
                    <DataGridCell colSpan={8}>
                      <Stack alignment="center" distribution="center" style={{ minHeight: 80 }}>
                        No error events in the selected time range.
                      </Stack>
                    </DataGridCell>
                  </DataGridRow>
                )}
              </DataGrid>
            </div>
          )}
          <PaginationBar page={errorPage} totalPages={totalErrorPages} pageSize={pageSize} totalHits={totalErrorHits} onPrev={() => setErrorPage((p) => Math.max(1, p - 1))} onNext={() => setErrorPage((p) => Math.min(totalErrorPages, p + 1))} onPageSize={(s) => { setPageSize(s); setErrorPage(1) }} />
        </div>
      </div>
    </Container>
  )
}

export default ErrorReport
