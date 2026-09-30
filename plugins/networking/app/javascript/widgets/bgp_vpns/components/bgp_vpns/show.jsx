import React from "react"
import { Button } from "react-bootstrap"
import { Modal } from "lib/components/Modal"
import { Tabs, Tab } from "lib/components/Tabs"
import { useHistory, useParams } from "react-router-dom"
import { useGlobalState } from "../../stateProvider"
import BgpVpnRouters from "./routers/list"
import RBAC from "./rbacs/list"

const Row = ({ label, value, children }) => {
  label = (label && label.replace("_", " ")) || ""
  return (
    <tr>
      <th style={{ width: "30%" }}>{label}</th>
      <td>{value || children}</td>
    </tr>
  )
}

const Show = () => {
  const [show, setShow] = React.useState(true)
  const history = useHistory()
  const { id, tab } = useParams()
  const { bgpvpns, cachedProjects } = useGlobalState()
  const cachedProjectsData = React.useMemo(
    () => cachedProjects.data || {},
    [cachedProjects.data]
  )

  const [currentTab, setCurrentTab] = React.useState(tab ? parseInt(tab) : 1)
  const selectTab = React.useCallback(
    (newTab) => {
      setCurrentTab(newTab)
      history.replace(`/${id}/${newTab}`)
    },
    [id]
  )

  const item = React.useMemo(() => {
    if (!id || bgpvpns.isFetching || !bgpvpns.items) return
    return bgpvpns.items.find((i) => i.id === id)
  }, [bgpvpns.items, id])

  const close = React.useCallback((e) => {
    setShow(false)
  }, [])

  const back = React.useCallback((e) => {
    history.replace("/")
  }, [])

  return (
    <Modal
      show={show}
      onHide={close}
      onExit={back}
      bsSize="large"
      aria-labelledby="contained-modal-title-lg"
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-lg">
          BGP VPN {item?.name}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {bgpvpns.isFetching ? (
          <span>
            <span className="spinner" />
            Loading...
          </span>
        ) : !item ? (
          <span>Could not find BGP VPN {id}</span>
        ) : (
          <Tabs
            defaultActiveKey={currentTab}
            id="routers"
            mountOnEnter={true}
            onSelect={(key) => selectTab(key)}
          >
            <Tab eventKey={1} title="Overview">
              <table className="table">
                <tbody>
                  <Row label="ID" value={item.id} />
                  <Row label="Name" value={item.name} />
                  <Row label="Project">
                    {cachedProjectsData[item.project_id] ? (
                      <>
                        <a
                          href={`/_/${item.project_id}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {
                            cachedProjectsData[item.project_id].payload?.scope
                              ?.domain_name
                          }
                          /{cachedProjectsData[item.project_id].name}
                        </a>
                        <br />
                        <span className="info-text">{item.project_id}</span>
                      </>
                    ) : (
                      item.project_id
                    )}
                  </Row>
                  <Row label="Shared" value={`${item.shared}`} />
                  <Row label="Type" value={item.type} />
                  <Row
                    label="Import Targets"
                    value={
                      item.import_targets && item.import_targets.join(", ")
                    }
                  />
                  <Row
                    label="Export Targets"
                    value={
                      item.export_targets && item.export_targets.join(", ")
                    }
                  />
                </tbody>
              </table>
            </Tab>
            <Tab eventKey={2} title="Routers">
              <BgpVpnRouters bgpvpn={item} />
            </Tab>
            <Tab eventKey={3} title="Access Control">
              <RBAC bgpvpn={item} />
            </Tab>
          </Tabs>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={close}>Close</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default Show
