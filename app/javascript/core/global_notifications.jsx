import React, { useEffect, useLayoutEffect, useMemo } from "react"
import { createRoot } from "react-dom/client"
import { Carousel, Alert } from "react-bootstrap"

const NOTIFICATION_POLLING_INTERVAL = 60 * 60 * 1000
const CAROUSEL_INTERVAL = 10000
const ICON_TYPES = {
  info: "info-circle",
  warning: "warning",
  error: "bolt",
  danger: "bolt",
  success: "check-circle",
}

const GlobalNotifications = () => {
  const [notifications, setNotifications] = React.useState([])

  const visibleNotifications = useMemo(() => {
    return notifications
      .filter((notification) => {
        if (!notification.start && !notification.end) return true

        // parse the start and end time to date object and write a warning if not valid date format
        if (notification.start && !Date.parse(notification.start)) {
          console.warn(`Invalid start time format for notification: ${notification.title}`)
        }
        if (notification.end && !Date.parse(notification.end)) {
          console.warn(`Invalid end time format for notification: ${notification.title}`)
        }

        // if start time is not set, it is considered as 0
        // if end time is not set, it is considered as Infinity
        const start = Date.parse(notification.start) || 0
        const end = Date.parse(notification.end) || Infinity
        const now = Date.now()
        return now > start && now < end
      })
      .filter((notification) => {
        // if no regions given return true
        if (!notification.regions || notification.regions?.length === 0) return true
        // check if the current region is in the list of regions
        return notification.regions?.includes(window.region)
      })
  }, [notifications])

  useLayoutEffect(() => {
    if (visibleNotifications?.length > 0) document.body?.classList?.add("has-global-notifications")
    else document.body?.classList?.remove("has-global-notifications")
    return () => document.body?.classList?.remove("has-global-notifications")
  }, [visibleNotifications])

  useEffect(() => {
    const load = async () => {
      //console.log("fetching global notifications")
      const response = await fetch("/system/notifications?" + Date.now())
      let data = await response.json()
      setNotifications(data?.global_notifications || [])
    }
    let timer = setInterval(load, NOTIFICATION_POLLING_INTERVAL)
    load()
    return () => clearInterval(timer)
  }, [])

  if (visibleNotifications?.length === 0) return null

  return (
    <div className="global-notifications">
      {visibleNotifications?.length === 1 ? (
        <Alert className="notification" variant={visibleNotifications[0].type || "info"}>
          <div className="notification-container">
            <i className={`fa fa-${ICON_TYPES[visibleNotifications[0].type] || "info"}`} />
            <b>{visibleNotifications[0]?.title}</b> {visibleNotifications[0]?.description}
          </div>
        </Alert>
      ) : (
        <Carousel interval={CAROUSEL_INTERVAL} indicators={false} controls={false}>
          {visibleNotifications.map((notification, index) => (
            <Carousel.Item key={index}>
              <Alert className="notification" variant={notification.type || "info"}>
                <div className="notification-container">
                  <i className={`fa fa-${ICON_TYPES[notification?.type] || "info"}`} />
                  <b>{notification?.title}</b> {notification?.description}{" "}
                </div>
                <small className="notification-counter">
                  {index + 1}/ {visibleNotifications.length}
                </small>
              </Alert>
            </Carousel.Item>
          ))}
        </Carousel>
      )}
    </div>
  )
}

const container = document.createElement("div")
const root = createRoot(container)
root.render(<GlobalNotifications />)

window.addEventListener("load", () => {
  document.body.prepend(container)
})
